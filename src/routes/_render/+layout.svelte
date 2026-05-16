<script lang="ts">
	let { children } = $props()
</script>

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
