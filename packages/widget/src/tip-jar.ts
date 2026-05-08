import type { TipReceipt } from './index.js';
import { isValidKey, buildPaymentXdr, submitSignedXdr, hasTrustline, USDC } from './stellar.js';
import { isFreighterAvailable, connectFreighter, signWithFreighter } from './wallet.js';
import type { WalletState } from './wallet.js';

type State =
  | { type: 'idle' }
  | { type: 'connecting' }
  | { type: 'ready'; wallet: WalletState }
  | { type: 'sending' }
  | { type: 'success'; txHash: string; amount: string; asset: string }
  | { type: 'error'; message: string };

const STYLES = `
  :host { display: block; font-family: system-ui, -apple-system, sans-serif; }
  * { box-sizing: border-box; }
  .jar {
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 14px;
    padding: 1.25rem;
    max-width: 300px;
  }
  .to {
    font-size: 0.7rem;
    color: #a8a29e;
    margin-bottom: 1rem;
    font-family: monospace;
    letter-spacing: 0.02em;
  }
  .amounts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.45rem;
    margin-bottom: 0.8rem;
  }
  .amt {
    border: 1.5px solid #e7e5e4;
    background: #faf9ff;
    border-radius: 8px;
    padding: 0.5rem 0.3rem;
    text-align: center;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 700;
    color: #1c1917;
    transition: border-color 0.12s, background 0.12s;
  }
  .amt:hover { border-color: #c4b5fd; }
  .amt.selected { border-color: #7c3aed; background: #ede9fe; color: #5b21b6; }
  .amt .unit { font-size: 0.65rem; font-weight: 500; color: #78716c; display: block; }
  .amt.selected .unit { color: #7c3aed; }
  .msg-input {
    width: 100%;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    padding: 0.45rem 0.65rem;
    font-size: 0.82rem;
    margin-bottom: 0.8rem;
    outline: none;
    color: #1c1917;
    background: #faf9ff;
  }
  .msg-input:focus { border-color: #7c3aed; }
  .wallet-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.65rem;
  }
  .wallet-dot {
    width: 7px;
    height: 7px;
    background: #059669;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .wallet-key {
    font-size: 0.72rem;
    color: #78716c;
    font-family: monospace;
  }
  .btn {
    width: 100%;
    border: none;
    border-radius: 9px;
    padding: 0.72rem;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.12s;
  }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-connect { background: #7c3aed; color: #fff; }
  .btn-send { background: #059669; color: #fff; }
  .success-wrap { text-align: center; padding: 0.25rem 0; }
  .success-icon { font-size: 2.2rem; line-height: 1; }
  .success-label {
    font-size: 0.92rem;
    font-weight: 700;
    color: #059669;
    margin: 0.5rem 0 0.3rem;
  }
  .success-hash {
    font-size: 0.65rem;
    color: #a8a29e;
    font-family: monospace;
    word-break: break-all;
  }
  .error-msg {
    font-size: 0.8rem;
    color: #dc2626;
    background: #fef2f2;
    border-radius: 8px;
    padding: 0.5rem 0.65rem;
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }
  .spinner {
    display: inline-block;
    width: 13px;
    height: 13px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.55s linear infinite;
    vertical-align: middle;
    margin-right: 0.4rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .no-wallet {
    font-size: 0.78rem;
    color: #78716c;
    text-align: center;
    margin-top: 0.6rem;
  }
  .no-wallet a { color: #7c3aed; }
`;

export class TipJarElement extends HTMLElement {
  public onTip?: (receipt: TipReceipt) => void;

  private shadow: ShadowRoot;
  private state: State = { type: 'idle' };
  private selectedAmount = '';
  private tipMessage = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['to', 'suggested', 'asset', 'message', 'theme'];
  }

  connectedCallback(): void {
    const amounts = this.suggestedAmounts;
    // Pre-select the middle amount, or first if only one
    this.selectedAmount = amounts[Math.floor(amounts.length / 2)] ?? amounts[0] ?? '5';
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private get recipientKey(): string {
    return this.getAttribute('to') ?? '';
  }

  private get suggestedAmounts(): string[] {
    return (this.getAttribute('suggested') ?? '1,5,20')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private get assetCode(): 'XLM' | 'USDC' {
    const a = this.getAttribute('asset');
    return a === 'XLM' ? 'XLM' : 'USDC';
  }

  private get showMessage(): boolean {
    return this.getAttribute('message') !== 'false';
  }

  private setState(next: State): void {
    this.state = next;
    this.render();
  }

  private async handleConnect(): Promise<void> {
    this.setState({ type: 'connecting' });
    try {
      const available = await isFreighterAvailable();
      if (!available) {
        // Surface a friendly error with a link instead of crashing
        this.setState({
          type: 'error',
          message: 'Freighter wallet not detected. Install it at freighter.app, then try again.',
        });
        return;
      }
      const wallet = await connectFreighter();
      this.setState({ type: 'ready', wallet });
    } catch (err) {
      this.setState({ type: 'error', message: (err as Error).message });
    }
  }

  private async handleSend(wallet: WalletState): Promise<void> {
    const to = this.recipientKey;
    if (!isValidKey(to)) {
      this.setState({ type: 'error', message: 'The creator wallet address is invalid.' });
      return;
    }

    const asset = this.assetCode;
    const amount = this.selectedAmount;
    const network = wallet.network;

    this.setState({ type: 'sending' });

    try {
      // Guard: if fan tries to send USDC, check their trustline first
      if (asset === 'USDC') {
        const trustlineExists = await hasTrustline(wallet.publicKey, USDC[network], network);
        if (!trustlineExists) {
          throw new Error(
            'Your wallet does not have a USDC trustline. Switch the widget to XLM, or add a USDC trustline in Freighter.',
          );
        }
      }

      const xdr = await buildPaymentXdr({
        from: wallet.publicKey,
        to,
        amount,
        asset,
        network,
        memo: this.tipMessage || undefined,
      });

      const signedXdr = await signWithFreighter(xdr, network);
      const txHash = await submitSignedXdr(signedXdr, network);

      const receipt: TipReceipt = { txHash, amount, asset, memo: this.tipMessage || undefined };

      // Fire programmatic callback (JS mount API)
      this.onTip?.(receipt);

      // Fire attribute-based callback (HTML attribute API)
      const callbackName = this.getAttribute('onTip');
      const win = window as unknown as Record<string, unknown>;
      if (callbackName && typeof win[callbackName] === 'function') {
        (win[callbackName] as (r: TipReceipt) => void)(receipt);
      }

      this.setState({ type: 'success', txHash, amount, asset });
    } catch (err) {
      this.setState({ type: 'error', message: (err as Error).message });
    }
  }

  private render(): void {
    const state = this.state;
    const amounts = this.suggestedAmounts;
    const asset = this.assetCode;
    const key = this.recipientKey;
    const shortKey = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '(no wallet set)';

    let body = '';

    if (state.type === 'success') {
      body = `
        <div class="success-wrap">
          <div class="success-icon">&#10004;&#65039;</div>
          <p class="success-label">Tip sent! ${state.amount} ${state.asset}</p>
          <p class="success-hash">${state.txHash}</p>
        </div>`;
    } else if (state.type === 'error') {
      body = `
        <div class="to">${shortKey}</div>
        <div class="error-msg">${state.message}</div>
        <button class="btn btn-connect" id="retry">Try again</button>`;
    } else if (state.type === 'connecting') {
      body = `
        <div class="to">${shortKey}</div>
        <button class="btn btn-connect" disabled>
          <span class="spinner"></span>Connecting wallet...
        </button>`;
    } else if (state.type === 'sending') {
      body = `
        <div class="to">${shortKey}</div>
        <button class="btn btn-send" disabled>
          <span class="spinner"></span>Sending ${this.selectedAmount} ${asset}...
        </button>`;
    } else if (state.type === 'ready') {
      const w = state.wallet;
      const shortWallet = `${w.publicKey.slice(0, 4)}...${w.publicKey.slice(-4)}`;
      body = `
        <div class="to">${shortKey}</div>
        <div class="amounts">
          ${amounts
            .map(
              (a) =>
                `<button class="amt${a === this.selectedAmount ? ' selected' : ''}" data-amt="${a}">
                  ${a}
                  <span class="unit">${asset}</span>
                </button>`,
            )
            .join('')}
        </div>
        ${this.showMessage ? `<input class="msg-input" placeholder="Leave a note (optional, 28 chars)" maxlength="28" value="${this.tipMessage.replace(/"/g, '&quot;')}" />` : ''}
        <div class="wallet-row">
          <span class="wallet-dot"></span>
          <span class="wallet-key">${shortWallet} (${w.network})</span>
        </div>
        <button class="btn btn-send" id="send">Send tip</button>`;
    } else {
      // idle
      body = `
        <div class="to">${shortKey}</div>
        <div class="amounts">
          ${amounts
            .map(
              (a) =>
                `<button class="amt${a === this.selectedAmount ? ' selected' : ''}" data-amt="${a}">
                  ${a}
                  <span class="unit">${asset}</span>
                </button>`,
            )
            .join('')}
        </div>
        <button class="btn btn-connect" id="connect">Connect wallet to tip</button>
        <p class="no-wallet">Need a wallet? Try <a href="https://freighter.app" target="_blank" rel="noopener">Freighter</a></p>`;
    }

    this.shadow.innerHTML = `<style>${STYLES}</style><div class="jar">${body}</div>`;

    // Wire up amount selection
    this.shadow.querySelectorAll<HTMLButtonElement>('.amt').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedAmount = btn.dataset.amt ?? this.selectedAmount;
        this.render();
      });
    });

    // Persist message across renders
    const msgInput = this.shadow.querySelector<HTMLInputElement>('.msg-input');
    if (msgInput) {
      msgInput.addEventListener('input', () => {
        this.tipMessage = msgInput.value;
      });
    }

    this.shadow.querySelector('#connect')?.addEventListener('click', () => this.handleConnect());

    if (state.type === 'ready') {
      this.shadow
        .querySelector('#send')
        ?.addEventListener('click', () => this.handleSend(state.wallet));
    }

    this.shadow
      .querySelector('#retry')
      ?.addEventListener('click', () => this.setState({ type: 'idle' }));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('tip-jar')) {
  customElements.define('tip-jar', TipJarElement);
}
