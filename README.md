# TipJar

> One-tap tipping for creators. Your fans send a few cents or a few dollars in USDC, and you keep almost all of it.

[![npm](https://img.shields.io/npm/v/@tipjar/widget.svg)](https://www.npmjs.com/package/@tipjar/widget)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TipJar is a drop-in tipping widget you paste into a blog post, a Twitch panel, a Substack, or your About page. Fans tip in USDC over the Stellar network — fees are fractions of a cent, settlement is around 5 seconds, and you don't need a Stripe account, a Ko-fi page, or a Patreon tier ladder.

## Why this exists

The current creator tipping stack is broken three ways:

- **Stripe-based platforms** (Ko-fi, Buy Me a Coffee) take 5–10% on small tips. On a $1 tip that's a quarter gone just to the rails.
- **Patreon** assumes a recurring commitment. Most fans don't want a subscription, they want to throw you a buck for one good post.
- **Crypto tipping today** still asks the fan to install a wallet, buy gas, and pick a network. Casual fans bounce.

TipJar splits the difference. Fans pay with a card on the front. The widget converts to USDC behind the scenes via a Stellar anchor and settles directly to your wallet. You keep near-100% of the tip. The fan never knows it's crypto.

## Try it in 30 seconds

```html
<script src="https://cdn.tipjar.dev/widget.js" defer></script>
<tip-jar to="GABCDEF...XYZ" suggested="1,5,20"></tip-jar>
```

Drop those two lines anywhere on a webpage. The widget renders, your fans tip, your wallet fills up.

## How it works

1. A fan clicks the tip button and picks an amount.
2. They pay with a card (Apple Pay, Google Pay, or card form). Their bank sees a normal charge.
3. A Stellar anchor receives the fiat and issues USDC on Stellar via SEP-24.
4. The widget submits a `payment` operation with the tip amount, plus a memo carrying the fan's optional message — "loved this post" — so creators can read tip notes in their dashboard.
5. Settlement lands in the creator's wallet in ~5 seconds. The widget shows a confetti burst and the fan moves on.

For crypto-native fans, the widget falls back to a "Pay with Stellar wallet" path that triggers Freighter, Albedo, or Lobstr directly — no anchor in the loop, no fiat conversion, even cheaper.

## Quickstart (self-host)

```bash
git clone https://github.com/bellabukss/tipjar.git
cd tipjar
pnpm install
cp .env.example .env   # add your wallet address + anchor credentials
pnpm dev
```

Open `http://localhost:3000`. Drop the widget snippet on the demo page and tip yourself.

## Configuration

| Env var | What it is | Default |
|---|---|---|
| `STELLAR_NETWORK` | `testnet` while developing, `public` for production | `testnet` |
| `ANCHOR_DOMAIN` | Stellar anchor handling fiat on-ramp | `testanchor.stellar.org` |
| `CREATOR_PUBKEY` | Default creator wallet on the demo page | — |
| `MEMO_ENABLED` | Include fan messages as on-chain memos | `true` |
| `WIDGET_THEME` | `light`, `dark`, or `auto` | `auto` |

## Widget API

```html
<tip-jar
  to="G..."                  
  suggested="1,5,20"         
  asset="USDC"               
  message="true"             
  theme="dark"               
  onTip="window.celebrate"   
></tip-jar>
```

Programmatic mount works too:

```js
import { mount } from '@tipjar/widget';

mount('#tip-here', {
  to: 'GABC...',
  suggested: [2, 10, 50],
  onTip: (receipt) => console.log('thanks!', receipt),
});
```

## Stellar primitives used

- **Payment operations** for the actual transfer
- **Memos** (`MEMO_TEXT`, up to 28 bytes) for fan notes — longer notes go in a hash memo with content stored off-chain
- **SEP-10** authentication for the creator dashboard (sign in with wallet)
- **SEP-24** interactive deposits when fans pay with a card
- **Trustlines** — the widget creates a USDC trustline on the creator's wallet on first activation if one doesn't exist

## Roadmap

- [x] Embed widget for static sites
- [x] Card-to-USDC via SEP-24 anchor
- [x] Wallet-direct path for crypto-native fans
- [ ] Twitch panel extension
- [ ] OBS browser-source overlay (live tip alerts, like Streamlabs)
- [ ] Subscription mode (recurring tips via Soroban auth contract)
- [ ] Custom asset support (creator-issued fan tokens)
- [ ] Multi-language widget (English, Spanish, Portuguese, French)

## FAQ

**Do my fans need a crypto wallet?**
No. The card path is the default. Fans tap in their card, the anchor handles the rest. They get a receipt by email.

**Do I need a crypto wallet?**
Yes — but it takes 60 seconds to make one (Freighter, Lobstr). Your TipJar dashboard can generate one for you if you'd rather not deal with it directly.

**What's the cut?**
TipJar itself takes 0%. The Stellar anchor that converts card → USDC takes a small fee (typically 1–2%). Stellar network fees are about $0.00001 per tip. Compared to Ko-fi's 5%, you keep a lot more.

**Can I cash out to my bank?**
Yes, via the same anchor in reverse (SEP-24 withdrawal). Or hold the USDC and use it on any Stellar-connected service.

**Is it custodial?**
No. Tips land in your wallet directly. We never touch your funds.

**Can fans tip anonymously?**
By default, yes — there's no fan account. They can optionally leave a name or handle that gets attached to the memo.

**What if the widget breaks on my page?**
Open an issue. The widget is a single web component with no required dependencies; conflicts are rare but we want to know.

## Contributing

PRs welcome. Run `pnpm test` before pushing. The widget code lives in `packages/widget`, the embed server in `packages/server`, and the demo site in `apps/demo`.

If you're adding support for a new anchor, drop a config entry in `packages/widget/src/anchors.ts` and a test fixture in `packages/widget/test/anchors/`.

## License

MIT. Tip freely.
