import { TipJarElement } from './tip-jar.js';

export interface MountOptions {
  to: string;
  suggested?: number[];
  asset?: 'USDC' | 'XLM';
  message?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onTip?: (receipt: TipReceipt) => void;
}

export interface TipReceipt {
  txHash: string;
  amount: string;
  asset: string;
  memo?: string;
}

export function mount(target: string | HTMLElement, options: MountOptions): TipJarElement {
  const host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!host) {
    throw new Error(`TipJar mount target not found: ${String(target)}`);
  }

  const el = document.createElement('tip-jar') as TipJarElement;
  el.setAttribute('to', options.to);
  if (options.suggested) el.setAttribute('suggested', options.suggested.join(','));
  if (options.asset) el.setAttribute('asset', options.asset);
  if (options.message !== undefined) el.setAttribute('message', String(options.message));
  if (options.theme) el.setAttribute('theme', options.theme);
  if (options.onTip) el.onTip = options.onTip;

  host.appendChild(el);
  return el;
}

export { TipJarElement };
