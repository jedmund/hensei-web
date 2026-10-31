<script lang="ts">
	import type { PageData } from './$types'
	import HomePage from '$lib/components/home/HomePage.svelte'

	let { data }: { data: PageData } = $props()
</script>

<HomePage {data} />
