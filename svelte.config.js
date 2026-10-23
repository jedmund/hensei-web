import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { loadEnv } from 'vite'
import { buildCspDirectives, cspConfig, parseCspMode } from './src/lib/security/cspPolicy.js'

// This file runs before Vite loads .env, so read it here. CSP_MODE is read at
// build time: report-only by default for production builds, off in dev.
const nodeEnv = process.env.NODE_ENV ?? 'development'
const env = loadEnv(nodeEnv, process.cwd(), '')
const cspMode = parseCspMode(env.CSP_MODE, nodeEnv === 'production' ? 'report-only' : 'off')
const csp = cspConfig(
	cspMode,
	buildCspDirectives({
		apiUrl: env.PUBLIC_SIERO_API_URL,
		imgUrl: env.PUBLIC_SIERO_IMG_URL,
		sentryDsn: env.PUBLIC_SENTRY_DSN
	})
)

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csp,
		// The origin check runs in hooks.server.ts (src/lib/server/csrf.ts)
		// instead, so it can exempt Apple's cross-site form_post callback.
		// '*' only switches off the built-in copy of that check.
		csrf: {
			trustedOrigins: ['*']
		},
		paths: {
			relative: false
		},
		alias: {
			$types: 'src/lib/types',
			'$lib/paraglide/messages': 'src/lib/paraglide/messages.js',
			'$lib/paraglide/runtime': 'src/lib/paraglide/runtime.js',
			'$lib/paraglide/server': 'src/lib/paraglide/server.js'
		}
	}
}

export default config
