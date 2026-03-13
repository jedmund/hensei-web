
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>{m.page_title_guides()}</title>
</svelte:head>

<div class="container">
	<h1>{m.guides_heading()}</h1>
	<p>{m.guides_description()}</p>
	<!-- Content will be added here -->
</div>

<style lang="scss">
	.container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;

		h1 {
			margin-bottom: 1rem;
		}

		p {
			color: var(--text-secondary);
		}
	}
</style>
