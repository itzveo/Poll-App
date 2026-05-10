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

  ngOnInit(): void {
    this.setupStyles();
    this.findCaret();
    this.bindEvents();
  }

  ngOnDestroy(): void {
    this.listeners.forEach((unlisten) => unlisten());
  }

  private setupStyles(): void {
    const input = this.el.nativeElement;
    const parent = input.parentElement;
    this.renderer.setStyle(input, 'caret-color', 'transparent');
    if (parent && getComputedStyle(parent).position === 'static') {
      this.renderer.setStyle(parent, 'position', 'relative');
    }
  }

  private findCaret(): void {
    const parent = this.el.nativeElement.parentElement;
    const existing = parent?.querySelector<HTMLElement>('.fake-caret');
    if (existing) {
      this.caret = existing;
    }
  }

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

  private createRuler(): {
    measure: (text: string) => number;
    lineHeight: number;
    remove: () => void;
  } {
    const input = this.el.nativeElement;
    const style = getComputedStyle(input);

    const ruler = document.createElement('span');
    ruler.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre;
    font-size: ${style.fontSize};
    font-family: ${style.fontFamily};
    font-weight: ${style.fontWeight};
    font-style: ${style.fontStyle};
    letter-spacing: ${style.letterSpacing};
    padding: 0; margin: 0; border: none;
  `;
    document.body.appendChild(ruler);

    ruler.textContent = '\u00A0';
    const lineHeight = ruler.getBoundingClientRect().height;

    const measure = (text: string): number => {
      ruler.textContent = text || '\u200b';
      return ruler.getBoundingClientRect().width;
    };

    return { measure, lineHeight, remove: () => document.body.removeChild(ruler) };
  }

  private measureCaretLeft(): number {
    const input = this.el.nativeElement;
    const style = getComputedStyle(input);
    const { measure, remove } = this.createRuler();

    const text = input.value.substring(0, input.selectionStart ?? 0);
    const width = text ? measure(text) : 0;
    remove();

    const paddingLeft = parseFloat(style.paddingLeft) || 8;
    return paddingLeft + width;
  }

  private measureTextareaCaretPosition(): { left: number; top: number } {
    const input = this.el.nativeElement as HTMLTextAreaElement;
    const style = getComputedStyle(input);
    const { measure, lineHeight, remove } = this.createRuler();

    const paddingLeft = parseFloat(style.paddingLeft) || 8;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const maxWidth = input.clientWidth - paddingLeft - (parseFloat(style.paddingRight) || 8);

    const fullText = input.value.substring(0, input.selectionStart ?? 0);
    const rawLines = fullText.split('\n');

    let totalLines = 0;
    let lastLineWidth = paddingLeft;

    for (const rawLine of rawLines) {
      if (rawLine === '') {
        totalLines++;
        lastLineWidth = paddingLeft;
        continue;
      }

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

      totalLines++;
      lastLineWidth = paddingLeft + measure(currentLine);
    }

    remove();

    const caretHeight = 18;
    return {
      left: lastLineWidth,
      top: paddingTop + (totalLines - 1) * lineHeight + (lineHeight - caretHeight) / 2,
    };
  }

  private updateCaret(): void {
    const input = this.el.nativeElement;
    const isTextarea = input.tagName.toLowerCase() === 'textarea';
    const inputRect = input.getBoundingClientRect();
    const parentRect = input.parentElement!.getBoundingClientRect();
    const offsetLeft = inputRect.left - parentRect.left;
    const offsetTop = inputRect.top - parentRect.top;

    if (isTextarea) {
      const { left, top } = this.measureTextareaCaretPosition();
      this.renderer.setStyle(this.caret, 'top', `${offsetTop + top}px`);
      this.renderer.setStyle(this.caret, 'transform', 'none');
      this.renderer.setStyle(this.caret, 'left', `${offsetLeft + left}px`);
    } else {
      this.renderer.setStyle(this.caret, 'top', '50%');
      this.renderer.setStyle(this.caret, 'transform', 'translateY(-50%)');
      this.renderer.setStyle(this.caret, 'left', `${offsetLeft + this.measureCaretLeft()}px`);
    }
  }
}
