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

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
