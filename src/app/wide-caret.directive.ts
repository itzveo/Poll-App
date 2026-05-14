import { Directive, ElementRef, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: 'input[wideCaret], textarea[wideCaret]',
  standalone: true,
})
export class WideCaretDirective implements OnInit, OnDestroy {
  private caret!: HTMLElement;
  private listeners: (() => void)[] = [];

  constructor(
    private el: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    private renderer: Renderer2,
  ) {}

  /** Initializes the directive by setting up input styles, locating the caret element, and binding events. */
  ngOnInit(): void {
    this.setupStyles();
    this.findCaret();
    this.bindEvents();
  }

  /** Removes all registered event listeners when the directive is destroyed. */
  ngOnDestroy(): void {
    this.listeners.forEach((unlisten) => unlisten());
  }

  /**
   * Hides the native caret of the input/textarea and ensures the parent element
   * has a non-static position so the fake caret can be positioned absolutely within it.
   */
  private setupStyles(): void {
    const input = this.el.nativeElement;
    const parent = input.parentElement;
    this.renderer.setStyle(input, 'caret-color', 'transparent');
    if (parent && getComputedStyle(parent).position === 'static') {
      this.renderer.setStyle(parent, 'position', 'relative');
    }
  }

  /**
   * Looks for an existing `.fake-caret` element inside the host's parent and stores
   * a reference to it. If none is found, caret updates are skipped.
   */
  private findCaret(): void {
    const parent = this.el.nativeElement.parentElement;
    const existing = parent?.querySelector<HTMLElement>('.fake-caret');
    if (existing) this.caret = existing;
  }

  /**
   * Attaches focus, blur, input, click, and keyup listeners to the host element
   * to show, hide, and reposition the fake caret in response to user interaction.
   */
  private bindEvents(): void {
    if (!this.caret) return;
    const input = this.el.nativeElement;
    const on = (event: string, fn: () => void) =>
      this.listeners.push(this.renderer.listen(input, event, fn));

    on('focus', () => {
      this.renderer.setStyle(this.caret, 'display', 'block');
      this.updateCaret();
    });
    on('blur', () => this.renderer.setStyle(this.caret, 'display', 'none'));
    on('input', () => this.updateCaret());
    on('click', () => this.updateCaret());
    on('keyup', () => this.updateCaret());
  }

  /**
   * Creates an invisible off-screen span element that mirrors the host element's
   * text styles, used to measure rendered text widths accurately.
   * @param style - The computed style of the host input/textarea element.
   * @returns The ruler span element, already appended to the document body.
   */
  private createRulerElement(style: CSSStyleDeclaration): HTMLSpanElement {
    const ruler = document.createElement('span');
    ruler.style.cssText = `
      position: absolute; visibility: hidden; white-space: pre;
      font-size: ${style.fontSize}; font-family: ${style.fontFamily};
      font-weight: ${style.fontWeight}; font-style: ${style.fontStyle};
      letter-spacing: ${style.letterSpacing}; padding: 0; margin: 0; border: none;
    `;
    document.body.appendChild(ruler);
    return ruler;
  }

  /**
   * Instantiates a ruler element and returns utilities to measure text widths and
   * the line height of the host element, as well as a cleanup function.
   * @returns An object with a `measure` function, the `lineHeight` in pixels, and a `remove` cleanup function.
   */
  private createRuler(): {
    measure: (text: string) => number;
    lineHeight: number;
    remove: () => void;
  } {
    const style = getComputedStyle(this.el.nativeElement);
    const ruler = this.createRulerElement(style);

    ruler.textContent = '\u00A0';
    const lineHeight = ruler.getBoundingClientRect().height;
    const measure = (text: string) => {
      ruler.textContent = text || '\u200b';
      return ruler.getBoundingClientRect().width;
    };

    return { measure, lineHeight, remove: () => document.body.removeChild(ruler) };
  }

  /**
   * Calculates the horizontal pixel offset of the caret within a single-line input
   * by measuring the width of the text before the current cursor position.
   * @returns The left offset in pixels, including the input's left padding.
   */
  private measureCaretLeft(): number {
    const input = this.el.nativeElement;
    const style = getComputedStyle(input);
    const { measure, remove } = this.createRuler();

    const text = input.value.substring(0, input.selectionStart ?? 0);
    const width = text ? measure(text) : 0;
    remove();

    return (parseFloat(style.paddingLeft) || 8) + width;
  }

  /**
   * Iterates over an array of raw text lines, accounting for word-wrap overflow,
   * and returns the total wrapped line count and the width of the last line.
   * @param rawLines - The lines of text split by newline characters.
   * @param measure - A function that returns the rendered pixel width of a given string.
   * @param maxWidth - The maximum available width in pixels before wrapping occurs.
   * @param paddingLeft - The left padding of the textarea in pixels.
   * @returns An object containing `totalLines` and `lastLineWidth`.
   */
  private wrapLines(
    rawLines: string[],
    measure: (t: string) => number,
    maxWidth: number,
    paddingLeft: number,
  ) {
    let totalLines = 0;
    let lastLineWidth = paddingLeft;

    for (const rawLine of rawLines) {
      if (rawLine === '') {
        totalLines++;
        lastLineWidth = paddingLeft;
        continue;
      }
      ({ totalLines, lastLineWidth } = this.wrapSingleLine(
        rawLine,
        measure,
        maxWidth,
        paddingLeft,
        totalLines,
      ));
    }

    return { totalLines, lastLineWidth };
  }

  /**
   * Simulates word-wrap for a single line of text character by character,
   * incrementing the line count whenever the rendered width exceeds the maximum.
   * @param rawLine - The raw text of a single line to wrap.
   * @param measure - A function that returns the rendered pixel width of a given string.
   * @param maxWidth - The maximum available width in pixels before wrapping occurs.
   * @param paddingLeft - The left padding of the textarea in pixels.
   * @param totalLines - The running line count to continue incrementing from.
   * @returns An object containing the updated `totalLines` and `lastLineWidth`.
   */
  private wrapSingleLine(
    rawLine: string,
    measure: (t: string) => number,
    maxWidth: number,
    paddingLeft: number,
    totalLines: number,
  ) {
    let currentLine = '';

    for (const char of rawLine) {
      const testLine = currentLine + char;
      if (measure(testLine) > maxWidth && currentLine.length > 0) {
        totalLines++;
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    return { totalLines: totalLines + 1, lastLineWidth: paddingLeft + measure(currentLine) };
  }

  /**
   * Calculates the exact pixel position (left and top) of the caret within a textarea,
   * accounting for newlines, character-level wrapping, line height, and padding.
   * @returns An object with `left` and `top` pixel offsets relative to the textarea.
   */
  private measureTextareaCaretPosition(): { left: number; top: number } {
    const input = this.el.nativeElement as HTMLTextAreaElement;
    const style = getComputedStyle(input);
    const { measure, lineHeight, remove } = this.createRuler();

    const paddingLeft = parseFloat(style.paddingLeft) || 8;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const maxWidth = input.clientWidth - paddingLeft - (parseFloat(style.paddingRight) || 8);

    const rawLines = input.value.substring(0, input.selectionStart ?? 0).split('\n');
    const { totalLines, lastLineWidth } = this.wrapLines(rawLines, measure, maxWidth, paddingLeft);
    remove();

    const caretHeight = 18;
    return {
      left: lastLineWidth,
      top: paddingTop + (totalLines - 1) * lineHeight + (lineHeight - caretHeight) / 2,
    };
  }

  /**
   * Computes the position of the host input/textarea relative to its parent element,
   * used to correctly offset the absolutely positioned fake caret.
   * @returns An object with `offsetLeft` and `offsetTop` pixel values.
   */
  private getOffsets(): { offsetLeft: number; offsetTop: number } {
    const inputRect = this.el.nativeElement.getBoundingClientRect();
    const parentRect = this.el.nativeElement.parentElement!.getBoundingClientRect();
    return {
      offsetLeft: inputRect.left - parentRect.left,
      offsetTop: inputRect.top - parentRect.top,
    };
  }

  /**
   * Positions the fake caret element for a textarea by applying the measured
   * top and left offsets as inline styles.
   * @param offsetLeft - The horizontal offset of the textarea relative to its parent in pixels.
   * @param offsetTop - The vertical offset of the textarea relative to its parent in pixels.
   */
  private applyTextareaCaretStyles(offsetLeft: number, offsetTop: number): void {
    const { left, top } = this.measureTextareaCaretPosition();
    this.renderer.setStyle(this.caret, 'top', `${offsetTop + top}px`);
    this.renderer.setStyle(this.caret, 'transform', 'none');
    this.renderer.setStyle(this.caret, 'left', `${offsetLeft + left}px`);
  }

  /**
   * Positions the fake caret element for a single-line input by centering it
   * vertically and placing it at the measured horizontal text offset.
   * @param offsetLeft - The horizontal offset of the input relative to its parent in pixels.
   */
  private applyInputCaretStyles(offsetLeft: number): void {
    this.renderer.setStyle(this.caret, 'top', '50%');
    this.renderer.setStyle(this.caret, 'transform', 'translateY(-50%)');
    this.renderer.setStyle(this.caret, 'left', `${offsetLeft + this.measureCaretLeft()}px`);
  }

  /**
   * Determines whether the host element is a textarea or a single-line input
   * and delegates to the appropriate caret positioning method.
   */
  private updateCaret(): void {
    const isTextarea = this.el.nativeElement.tagName.toLowerCase() === 'textarea';
    const { offsetLeft, offsetTop } = this.getOffsets();

    if (isTextarea) {
      this.applyTextareaCaretStyles(offsetLeft, offsetTop);
    } else {
      this.applyInputCaretStyles(offsetLeft);
    }
  }
}
