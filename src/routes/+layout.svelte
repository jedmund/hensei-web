<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'

	export const prerender = false

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
