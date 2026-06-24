import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sentrySvelteKit } from '@sentry/sveltekit'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
	define: {
		__BUILD_TIMESTAMP__: JSON.stringify(Date.now().toString())
	},
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
				...({
					api: 'modern-compiler',
					loadPaths: [fileURLToPath(new URL('./src', import.meta.url))]
				} as object)
			}
		}
	},
	assetsInclude: ['**/*.svg'],
	plugins: [
		// Must come before sveltekit(). Uploads source maps when SENTRY_AUTH_TOKEN
		// (+ org/project) are set at build time; skips the upload otherwise, so
		// local/dev builds work without any Sentry credentials.
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				authToken: process.env.SENTRY_AUTH_TOKEN,
				telemetry: false
			}
		}),
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
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
})
