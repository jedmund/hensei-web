<script lang="ts">
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const Screen = $derived(data.screen)
</script>

<Screen {data} />
