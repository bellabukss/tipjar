import type { TipReceipt } from './index.js';

export class TipJarElement extends HTMLElement {
  public onTip?: (receipt: TipReceipt) => void;

  static get observedAttributes(): string[] {
    return ['to', 'suggested', 'asset', 'message', 'theme'];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    this.textContent = '';
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('tip-jar')) {
  customElements.define('tip-jar', TipJarElement);
}
