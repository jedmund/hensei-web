<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import { browser } from '$app/environment'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import { Toaster } from 'svelte-sonner'
	import type { LayoutData } from './$types'

	const { data, children } = $props<{
		data: LayoutData & { [key: string]: any }
		children: () => any
	}>()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
	<Toaster position="bottom-right" richColors toastOptions={{ duration: 4000 }} />
	{@render children?.()}
</QueryClientProvider>
