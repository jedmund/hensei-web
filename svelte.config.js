import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$types: 'src/lib/types',
			'$lib/paraglide/messages': 'src/paraglide/messages.js',
			'$lib/paraglide/runtime': 'src/paraglide/runtime.js',
			'$lib/paraglide/server': 'src/paraglide/server.js'
		}
	}
}

export default config
