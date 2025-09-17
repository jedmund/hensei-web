<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import Navigation from '$lib/components/Navigation.svelte'
	import { Tooltip } from 'bits-ui'

	// Get `data` and `children` from the router via $props()
	// Use a more flexible type that allows additional properties from child pages
	const { data, children } = $props<{
		data: any  // Allow any data to pass through from child pages
		children: () => any
	}>()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider>
	<main>
		<Navigation isAuthenticated={data?.isAuthenticated} username={data?.account?.username} role={data?.account?.role} />
		{@render children?.()}
	</main>
</Tooltip.Provider>
