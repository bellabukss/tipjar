# TipJar

TipJar is a drop-in tipping widget you paste into a blog post, a Twitch panel, a Substack, or your About page. Fans tip in USDC over the Stellar network. Fees are fractions of a cent, settlement is around 5 seconds, and you don't need a Stripe account, a Ko-fi page, or a Patreon tier ladder.

## Why this exists

The current creator tipping stack is broken three ways:

- **Stripe-based platforms** (Ko-fi, Buy Me a Coffee) take 5-10% on small tips. On a $1 tip that's a quarter gone just to the rails.
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
4. The widget submits a `payment` operation with the tip amount, plus a memo carrying the fan's optional message so creators can read tip notes in their dashboard.
5. Settlement lands in the creator's wallet in ~5 seconds. The widget shows a confetti burst and the fan moves on.

For crypto-native fans, the widget falls back to a "Pay with Stellar wallet" path that triggers Freighter, Albedo, or Lobstr directly. No anchor in the loop, no fiat conversion, even cheaper.

## Repository Structure

```
tipjar/
├── apps/
│   └── demo/               # Static demo page served at tipjarrr.vercel.app
│       └── index.html      # Landing page and embedded widget example
├── packages/
│   ├── widget/             # The embeddable web component (@tipjar/widget)
│   │   └── src/
│   │       ├── index.ts    # Package entry point; exports mount() and the custom element
│   │       ├── tip-jar.ts  # <tip-jar> web component definition and render logic
│   │       ├── anchors.ts  # Stellar anchor configs (one entry per supported corridor)
│   │       └── types.ts    # Shared TypeScript types (TipReceipt, WidgetConfig, etc.)
│   └── server/             # Lightweight embed server (@tipjar/server)
│       └── src/
│           └── index.ts    # Express server: serves widget.js bundle and handles SEP-24 callbacks
├── .env.example            # All required environment variables with descriptions
├── package.json            # pnpm workspace root; shared dev dependencies
├── pnpm-workspace.yaml     # Declares packages/* and apps/* as workspace members
└── tsconfig.base.json      # Base TypeScript config extended by each package
```

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A Stellar testnet wallet (create one free at [Stellar Laboratory](https://laboratory.stellar.org))

### Install and run

```bash
git clone https://github.com/bellabukss/tipjar.git
cd tipjar
pnpm install
cp .env.example .env        # fill in CREATOR_PUBKEY at minimum; rest can stay as defaults
pnpm dev                    # starts the embed server on :3000 and watches widget source
```

Open `http://localhost:3000`. The demo page loads the widget pointed at your testnet wallet. Tip yourself to verify the full flow.

### Run tests

```bash
pnpm test                           # all packages
pnpm -F @tipjar/widget test         # widget unit tests only
pnpm -F @tipjar/server test         # server tests only
```

## Configuration

| Env var | What it is | Default |
|---|---|---|
| `STELLAR_NETWORK` | `testnet` while developing, `public` for production | `testnet` |
| `ANCHOR_DOMAIN` | Stellar anchor handling fiat on-ramp | `testanchor.stellar.org` |
| `CREATOR_PUBKEY` | Default creator wallet on the demo page | (required) |
| `MEMO_ENABLED` | Include fan messages as on-chain memos | `true` |
| `WIDGET_THEME` | `light`, `dark`, or `auto` | `auto` |

## Widget API

### HTML attributes

```html
<tip-jar
  to="G..."              <!-- creator's Stellar public key (required) -->
  suggested="1,5,20"     <!-- comma-separated preset amounts in USD -->
  asset="USDC"           <!-- asset code; must have a trustline on the creator wallet -->
  message="true"         <!-- show the optional fan message field -->
  theme="dark"           <!-- light | dark | auto -->
  onTip="window.celebrate"  <!-- global callback name, called with TipReceipt on success -->
></tip-jar>
```

### JavaScript mount

```js
import { mount } from '@tipjar/widget';

mount('#tip-here', {
  to: 'GABC...',
  suggested: [2, 10, 50],
  onTip: (receipt) => console.log('thanks!', receipt),
});
```

## Contributing

PRs are welcome for bug fixes, new anchor support, widget improvements, and SDK examples. For larger changes, open a GitHub Discussion first to align on direction before writing code.

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/obs-overlay` |
| Bug fix | `fix/<short-description>` | `fix/memo-truncation` |
| New anchor | `anchor/<name>` | `anchor/clickpesa` |
| Docs | `docs/<short-description>` | `docs/widget-api` |

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(widget): add OBS browser-source overlay mode
fix(server): handle SEP-24 callback with missing memo field
anchor(clickpesa): add Tanzania and Uganda corridor config
docs(readme): expand development setup section
```

### PR checklist

- `pnpm test` passes locally
- `pnpm lint` passes with no new warnings
- New behaviour is covered by at least one test
- PR description links the relevant issue (`closes #N`)

### Adding a new anchor

1. Add a config entry in `packages/widget/src/anchors.ts` following the existing shape.
2. Add a test fixture in `packages/widget/test/anchors/` with a sample SEP-24 response.
3. Update `.env.example` if the anchor needs a new credential.

## Stellar Primitives Used

- **Payment operations** for the actual transfer
- **Memos** (`MEMO_TEXT`, up to 28 bytes) for fan notes; longer notes go in a hash memo with content stored off-chain
- **SEP-10** authentication for the creator dashboard (sign in with wallet)
- **SEP-24** interactive deposits when fans pay with a card
- **Trustlines** - the widget creates a USDC trustline on the creator's wallet on first activation if one does not exist

## Roadmap

- [x] Embed widget for static sites
- [x] Card-to-USDC via SEP-24 anchor
- [x] Wallet-direct path for crypto-native fans
- [ ] Twitch panel extension
- [ ] OBS browser-source overlay (live tip alerts)
- [ ] Subscription mode (recurring tips via Soroban auth contract)
- [ ] Custom asset support (creator-issued fan tokens)
- [ ] Multi-language widget (English, Spanish, Portuguese, French)

## FAQ

**Do my fans need a crypto wallet?**
No. The card path is the default. Fans enter their card details, the anchor handles the rest, and they get a receipt by email.

**What's the cut?**
TipJar itself takes 0%. The Stellar anchor that converts card to USDC takes a small fee (typically 1-2%). Stellar network fees are about $0.00001 per tip. Compared to Ko-fi's 5%, you keep significantly more.

**Is it custodial?**
No. Tips land directly in your wallet. TipJar never holds your funds.

## License

MIT. Tip freely.
