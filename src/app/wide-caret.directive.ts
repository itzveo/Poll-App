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

  private measureCaretLeft(): number {
    const input = this.el.nativeElement;
    const style = getComputedStyle(input);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${style.fontSize} ${style.fontFamily}`;
    const text = input.value.substring(0, input.selectionStart ?? 0);
    const paddingLeft = parseFloat(style.paddingLeft) || 8;
    return paddingLeft + ctx.measureText(text).width;
  }

  private updateCaret(): void {
    const input = this.el.nativeElement;
    const isTextarea = input.tagName.toLowerCase() === 'textarea';
    const inputRect = input.getBoundingClientRect();
    const parentRect = input.parentElement!.getBoundingClientRect();
    const offsetLeft = inputRect.left - parentRect.left;
    const offsetTop = inputRect.top - parentRect.top;
    const style = getComputedStyle(input);
    const paddingTop = parseFloat(style.paddingTop) || 0;

    if (isTextarea) {
      this.renderer.setStyle(this.caret, 'top', `${offsetTop + paddingTop}px`);
      this.renderer.setStyle(this.caret, 'transform', 'none');
    } else {
      this.renderer.setStyle(this.caret, 'top', '50%');
      this.renderer.setStyle(this.caret, 'transform', 'translateY(-50%)');
    }

    this.renderer.setStyle(this.caret, 'left', `${offsetLeft + this.measureCaretLeft()}px`);
  }
}
