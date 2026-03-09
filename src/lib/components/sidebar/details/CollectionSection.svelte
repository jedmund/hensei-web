<script lang="ts">
	interface Props {
		type: 'character' | 'weapon' | 'summon'
		count: number
		element: number | undefined
	}

	let { type, count, element }: Props = $props()

	const ELEMENT_NAMES: Record<number, string> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	const elementName = $derived(element ? ELEMENT_NAMES[element] ?? 'null' : 'null')
</script>

{#if count > 0}
	<div
		class="collection-section"
		style:background="var(--{elementName}-nav-selected-bg)"
		style:color="var(--{elementName}-nav-selected-text)"
	>
		<span>{type === 'character' ? 'In your Collection' : `${count} in your Collection`}</span>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.collection-section {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		margin: 0 spacing.$unit-2x;
		border-radius: spacing.$unit;
		font-size: typography.$font-small;
	}
</style>
