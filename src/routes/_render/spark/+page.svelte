<script lang="ts">
	import SparkImage from '$lib/components/spark/SparkImage.svelte'

	let { data } = $props()
</script>

<!-- The renderer screenshots this frame (main > *:first-child) at 1200x630 -->
<SparkImage data={data.spark} theme={data.theme} />
