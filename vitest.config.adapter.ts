import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
	test: {
		name: 'adapters',
		include: ['src/lib/api/adapters/**/*.test.ts'],
		environment: 'node',
		globals: true,
		setupFiles: ['./src/lib/api/adapters/test-setup.ts'],
		testTimeout: 5000,
		// Use forked pool in CI/sandbox to avoid worker kill EPERM issues
		pool:
			(process.env.VITEST_POOL as 'threads' | 'forks' | undefined) ||
			(process.env.CI || process.env.SEATBELT ? 'forks' : undefined),
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/api/adapters/**/*.ts'],
			exclude: ['**/*.test.ts', '**/__tests__/**', '**/__fixtures__/**', '**/test-setup.ts']
		}
	},
	resolve: {
		alias: {
			'$lib/stores/auth.store.svelte': resolve(
				'./src/lib/api/adapters/__tests__/auth-store-mock.ts'
			),
			$lib: resolve('./src/lib'),
			$types: resolve('./src/lib/types'),
			'$app/environment': resolve('./src/lib/api/adapters/__tests__/app-environment-mock.ts'),
			'$env/static/public': resolve('./src/lib/api/adapters/__tests__/env-mock.ts')
		}
	}
})
