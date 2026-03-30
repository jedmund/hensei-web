<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import { browser } from '$app/environment'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import { Toaster } from 'svelte-sonner'
	import { untrack, type Snippet } from 'svelte'
	import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'
	import { setSimplePortraits } from '$lib/stores/simplePortraits.svelte'
	import { setDefaultRepView } from '$lib/stores/defaultRepView.svelte'
	import type { LayoutData } from './$types'

	const { data, children } = $props<{
		data: LayoutData & { [key: string]: unknown }
		children: Snippet
	}>()

	setSimplePortraits(data.currentUser?.simplePortraits ?? false)
	setDefaultRepView(data.currentUser?.defaultRepView ?? 'weapons')

	// Initialize theme from user cookie preference
	$effect(() => {
		if (browser) {
			const userTheme = (data.themePreference as ThemePreference) ?? 'system'
			untrack(() => themeStore.init(userTheme))
		}
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
	<Toaster position="bottom-right" richColors toastOptions={{ duration: 4000 }} />
	{@render children?.()}
</QueryClientProvider>
