<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import CharacterTag from '$lib/components/tags/CharacterTag.svelte'

	const { row }: Cell = $props()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid IRow is untyped
	const character = row as any
</script>

<div class="season-cell">
	<CharacterTag {character} type="season" />
</div>

<style lang="scss">
	.season-cell {
		display: flex;
		align-items: center;
		height: 100%;
	}
</style>
