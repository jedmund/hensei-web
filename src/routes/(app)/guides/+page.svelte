<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Guides</title>
</svelte:head>

<div class="container">
	<h1>Guides</h1>
	<p>Guides and resources for Granblue Fantasy players.</p>
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
