<script lang="ts">
	let { children } = $props()
</script>

<!--
	Suppress the browser's automatic /favicon.ico fetch during rendering.
	Without this, the renderer's Chromium hits SvelteKit's catch-all
	(app)/[username]/(profile) route with [username]=favicon.ico, which
	forwards a phantom user lookup to the API and crashes its blueprint.
-->
<svelte:head>
	<link rel="icon" href="data:," />
</svelte:head>

<!--
	Bare layout for internal render routes. No nav, no chrome, no global
	styles beyond what the card itself imports — Playwright screenshots the
	first child of <main>.
-->
<main>
	{@render children()}
</main>

<style>
	/* Minimal reset so the screenshot starts from a known baseline. */
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: transparent;
	}

	main {
		display: block;
	}
</style>
