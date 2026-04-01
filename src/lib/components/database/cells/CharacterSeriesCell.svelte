<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'

	const { row }: Cell = $props()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid IRow is untyped
	const character = row as any
</script>

<div class="series-cell">
	<CharacterTags {character} />
</div>

<style lang="scss">
	.series-cell {
		display: flex;
		align-items: center;
		height: 100%;
	}
</style>
