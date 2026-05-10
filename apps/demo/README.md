# @tipjar/demo

A static page that mounts the TipJar widget against a placeholder creator wallet for visual development and end-to-end verification.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

## Running locally

1. Install all workspace dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. Build the widget package first:

   ```bash
   pnpm --filter @tipjar/widget build
   ```

3. Open `apps/demo/index.html` directly in your browser — no dev server is needed.

   Alternatively, build the demo bundle:

   ```bash
   pnpm --filter @tipjar/demo build
   ```

   Then open `apps/demo/dist/index.html`.
