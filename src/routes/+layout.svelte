<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/ui/Sidebar.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
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
	<div class="app-container">
		<main class:sidebar-open={sidebar.isOpen}>
			<Navigation isAuthenticated={data?.isAuthenticated} username={data?.account?.username} role={data?.account?.role} />
			{@render children?.()}
		</main>

		<Sidebar
			open={sidebar.isOpen}
			title={sidebar.title}
			onclose={() => sidebar.close()}
		>
			{#if sidebar.component}
				<svelte:component this={sidebar.component} {...sidebar.componentProps} />
			{:else if sidebar.content}
				{@render sidebar.content()}
			{/if}
		</Sidebar>
	</div>
</Tooltip.Provider>

<style lang="scss">
	@use '$src/themes/effects' as *;

	.app-container {
		display: flex;
		min-height: 100vh;
		width: 100%;
		overflow-x: hidden;
	}

	main {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		transition: margin-right $duration-slide ease-in-out;
	}
</style>
