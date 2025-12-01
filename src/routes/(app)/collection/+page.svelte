<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Collection</title>
</svelte:head>

<div class="container">
	<h1>Collection</h1>
	<p>Your collection in Granblue Fantasy</p>
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
