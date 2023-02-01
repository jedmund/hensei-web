![Header image for hensei-web](README.png)
hensei-web is the frontend for granblue.team, an app for saving and sharing teams for [Granblue Fantasy](https://game.granbluefantasy.jp).

## Getting Started

First, you have to set up your environment file. `.env.sample` is provided as an example, but here we'll show an even more explicit example for running locally:

```
# Enable relative paths for imports.
NODE_PATH='src/'

# App URLs
# Don't add a trailing slash to these URLs.
# The API will run on port 3000 by default, but make sure to change
# this if you use a different port.
NEXT_PUBLIC_SIERO_API_URL='http://127.0.0.1:3000/api/v1'
NEXT_PUBLIC_SIERO_OAUTH_URL='http://127.0.0.1:3000/oauth'

# This will serve images out of the Next.js /public directory in development,
# but in production, you will want this to host these images on a cloud storage provider
# like Amazon S3, and then change this to the full bucket URL.
NEXT_PUBLIC_SIERO_IMG_URL='/images'

# You will have to use a Google account to acquire a Youtube API key
# or embeds will not work!
NEXT_PUBLIC_YOUTUBE_API_KEY=''
```

Then, install all dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server with:

```bash
npm run dev
# or
yarn dev
```

## Assets

The [hensei-api](https://github.com/jedmund/hensei-api) has tasks that will help you get assets, although some were crafted or renamed by hand. The front-end expects this folder structure inside of the `images` folder:

```
/
├─ accessory-grid/
├─ accessory-square/
├─ awakening/
├─ ax/
├─ chara-main/
├─ chara-grid/
├─ chara-square/
├─ jobs/
├─ job-icons/
├─ job-skills/
├─ mastery/
├─ summon-main/
├─ summon-grid/
├─ summon-square/
├─ updates/
├─ weapon-main/
├─ weapon-grid/
├─ weapon-square/
```
