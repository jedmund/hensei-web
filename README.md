# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Local images

When `PUBLIC_SIERO_IMG_URL` is empty, images are served from `static/images/`, a git-ignored mirror of the `siero-img` S3 bucket. To pull down anything missing without re-downloading what you already have:

```sh
cd static/images
aws s3 sync s3://siero-img/ . --size-only
```

`--size-only` skips files that already match by size, even if their timestamps differ. Add `--dryrun` first to preview what will download.

### Testing from a phone

1. Connect your Mac and phone to the same Wi-Fi network. Run
   `ipconfig getifaddr en0` to find your Mac's Wi-Fi address (use the active
   network interface if it is not `en0`). The examples below use `192.168.1.50`;
   replace it with your address.
2. In the API repository, start Rails with the exact frontend origin enabled:

   ```sh
   DEV_CORS_ORIGINS=http://192.168.1.50:5174 bin/rails server -b 0.0.0.0
   ```

   This requires the API's development CORS configuration from
   [hensei-api#391](https://github.com/jedmund/hensei-api/pull/391).

3. In this repository, add or update this value in your existing gitignored
   `.env.local` file, preserving its other settings:

   ```dotenv
   PUBLIC_SIERO_API_URL=http://192.168.1.50:3000
   ```

   Use the base URL without `/api/v1` or `/oauth`; the app adds those paths.
   `PUBLIC_SIERO_OAUTH_URL` is not needed. Keep your existing
   `PUBLIC_SIERO_IMG_URL`: a CDN URL works from the phone, and an empty value uses
   this web server's `static/images/` directory. A `localhost` image URL needs
   to use your Mac's address instead.

4. Run `pnpm dev:mobile`, then open `http://192.168.1.50:5174` on your phone.
   The command keeps port 5174 fixed so it matches the API's allowed origin.

If the page does not load, allow incoming connections for Node and Ruby in your
Mac's firewall and check whether the Wi-Fi network isolates devices. If API
calls fail, check the configured IP, scheme and ports, and restart both servers
after changing environment settings. On your phone, `localhost` refers to the
phone, not your Mac. Use this setup on a trusted local network and stop the
servers when finished.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
