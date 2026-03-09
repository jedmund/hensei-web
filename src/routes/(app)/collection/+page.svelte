
<script lang="ts">
	import { page } from '$app/stores'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
</script>

<PageMeta title={m.page_title_collection()} description={m.page_desc_collection()} />

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
