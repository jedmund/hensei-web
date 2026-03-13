import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
	resolve: {
		alias: {
			$src: fileURLToPath(new URL('./src', import.meta.url)),
			$themes: fileURLToPath(new URL('./src/themes', import.meta.url))
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				// Modern compiler API for better Sass compatibility
				// Type assertion needed as Vite types haven't been updated yet
				...(({ api: 'modern-compiler', loadPaths: [fileURLToPath(new URL('./src', import.meta.url))] }) as object)
			}
		}
	},
	assetsInclude: ['**/*.svg'],
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// Cookie first so explicit user choice wins over browser preference
			strategy: ['cookie', 'url', 'preferredLanguage', 'baseLocale']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
})
