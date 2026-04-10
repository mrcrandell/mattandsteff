# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## PWA Production Checklist

Use this checklist for a fast, low-risk PWA rollout.

1. Set `NUXT_PUBLIC_ENABLE_PWA=true` for preview and confirm expected startup mode logs.
2. On preview, test Android Chrome and iOS Safari:
   - First load online
   - Reload
   - Offline reopen with cached gallery content
   - Return online and confirm one refresh notice
3. Open DevTools Application panel and confirm no PWA/manifest install warnings.
4. Validate rollback path by setting `NUXT_PUBLIC_ENABLE_PWA=false` in preview and verifying stale service worker cleanup.
5. Deploy production as a short canary window first, then keep enabled if stable.
