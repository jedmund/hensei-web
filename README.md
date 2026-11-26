# hensei-web

The web app for [granblue.team](https://granblue.team), a team builder for Granblue Fantasy. You can build and share parties, track your collection, and look up characters, weapons and summons.

It's a SvelteKit app that talks to the Rails API in [jedmund/hensei-api](https://github.com/jedmund/hensei-api). The browser extension in [jedmund/hensei-extractor](https://github.com/jedmund/hensei-extractor) imports data from the game into it.

## Stack

SvelteKit 2 and Svelte 5 (runes), Vite, TypeScript, TanStack Query, Paraglide for English and Japanese, and SCSS. Code conventions are in [`CLAUDE.md`](CLAUDE.md).

## Setup

You need Node 24 (see `.nvmrc`) and pnpm 10. With Corepack, `corepack enable` picks up the pnpm version pinned in `package.json`.

```sh
git clone https://github.com/jedmund/hensei-web.git
cd hensei-web
pnpm install
```

### Environment

Put local settings in `.env.local`, which is gitignored. The app starts without one, using `http://localhost:3000` for the API and `static/images/` for images. Most people set these two:

```dotenv
# Base URL of the API, without /api/v1 or /oauth (the app adds those)
PUBLIC_SIERO_API_URL=http://localhost:3000
# Leave empty to serve images from static/images/ (see Images below)
PUBLIC_SIERO_IMG_URL=https://siero-img.s3-us-west-2.amazonaws.com
```

Other variables are optional locally:

| Variable                                 | What it's for                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_INTERNAL_SECRET`                    | A secret shared with the API. If you set it, use the same value on both.                                                                                                                                       |
| `PUBLIC_SOCIAL_LOGIN_PROVIDERS`          | Comma-separated social logins to show, such as `discord,google`. Each needs its `*_CLIENT_ID` and `*_CLIENT_SECRET` (Apple uses `APPLE_SERVICES_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY`). |
| `EXTENSION_IDS`                          | Comma-separated extension IDs allowed to log in through the site. Add the unpacked extension's ID (`lcobmjandcaicggiddpheahpogbdodid`) to test extension login locally.                                        |
| `RENDER_HMAC_SECRET`, `RENDER_S3_BUCKET` | Rendered share images and PNG downloads, which are cached in S3 using `RENDER_S3_*` or `AWS_*` credentials. Not needed unless you're working on them.                                                          |
| `PUBLIC_SENTRY_DSN`                      | Error reporting. Leave unset locally.                                                                                                                                                                          |

Restart the dev server after changing any of these.

### Running against a local API

Set up [hensei-api](https://github.com/jedmund/hensei-api#initial-setup) and start it on port 3000. Its development CORS settings already allow `http://localhost:5174`, so `pnpm dev` works against it without extra configuration. You'll need to sign up for an account on your local copy, since it has its own database.

## Commands

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `pnpm dev`        | Dev server on http://localhost:5174                       |
| `pnpm dev:mobile` | Dev server on your network, for phone testing (see below) |
| `pnpm build`      | Production build (Node adapter)                           |
| `pnpm preview`    | Serve the production build                                |
| `pnpm test`       | Unit tests (Vitest)                                       |
| `pnpm check`      | Compile translations, then type-check with `svelte-check` |
| `pnpm lint`       | Prettier and ESLint                                       |
| `pnpm format`     | Format everything with Prettier                           |
| `pnpm storybook`  | Storybook on port 6006                                    |

`pnpm check` recompiles the Paraglide messages, which can break a running dev server. Restart it afterwards.

## Images

Images and fonts come from the `siero-img` S3 bucket. The simplest setup points straight at it:

```dotenv
PUBLIC_SIERO_IMG_URL=https://siero-img.s3-us-west-2.amazonaws.com
```

When `PUBLIC_SIERO_IMG_URL` is empty, they're served from `static/images/`, a git-ignored mirror of the `siero-img` S3 bucket. To pull down anything missing without re-downloading what you already have:

```sh
cd static/images
aws s3 sync s3://siero-img/ . --size-only
```

`--size-only` skips files that already match by size, even if their timestamps differ. Add `--dryrun` first to preview what will download. The full mirror is a few gigabytes, and it needs AWS credentials with read access to the bucket. Fonts are read from `static/fonts/` in this mode, so copy the bucket's `fonts/` folder there as well.

## Testing from a phone

1. Connect your computer and phone to the same network. Find your computer's
   local network address: `ipconfig getifaddr en0` on macOS, `hostname -I` on
   Linux, or `ipconfig` on Windows (look for the IPv4 address). The examples
   below use `192.168.1.50`; replace it with your address.
2. In the API repository, start Rails with the exact frontend origin enabled:

   ```sh
   DEV_CORS_ORIGINS=http://192.168.1.50:5174 bin/rails server -b 0.0.0.0
   ```

3. In this repository, add or update this value in your existing gitignored
   `.env.local` file, preserving its other settings:

   ```dotenv
   PUBLIC_SIERO_API_URL=http://192.168.1.50:3000
   ```

   Use the base URL without `/api/v1` or `/oauth`; the app adds those paths.
   `PUBLIC_SIERO_OAUTH_URL` is not needed. Keep your existing
   `PUBLIC_SIERO_IMG_URL`: a CDN URL works from the phone, and an empty value uses
   this web server's `static/images/` directory. A `localhost` image URL needs
   to use your computer's address instead.

4. Run `pnpm dev:mobile`, then open `http://192.168.1.50:5174` on your phone.
   The command keeps port 5174 fixed so it matches the API's allowed origin.

If the page does not load, allow incoming connections for Node and Ruby in your
computer's firewall and check whether the network isolates devices. If API
calls fail, check the configured IP, scheme and ports, and restart both servers
after changing environment settings. On your phone, `localhost` refers to the
phone, not your computer. Use this setup on a trusted local network and stop the
servers when finished.

## Deployment

The app builds with [`adapter-node`](https://svelte.dev/docs/kit/adapter-node) into a standalone Node server.

1. Set `PUBLIC_SIERO_API_URL` and `PUBLIC_SIERO_IMG_URL` before building. They're read with `$env/static/public`, so their values are baked into the build.
2. Build and start the server:

   ```sh
   pnpm install --frozen-lockfile
   pnpm build
   node build
   ```

3. Set `ORIGIN` to the app's public URL (for example `https://teams.example.com`) and `PORT` to the port it should listen on (the default is 3000). Server-only variables from the table above, such as `API_INTERNAL_SECRET`, are read when the server starts.
4. Share images are rendered with headless Chromium. To use them, install it on the server:

   ```sh
   pnpm exec playwright install --only-shell chromium
   ```

## License

See [LICENSE](LICENSE).
