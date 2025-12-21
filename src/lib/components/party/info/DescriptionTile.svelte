<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'

	interface Props {
		description?: string
		onOpen: () => void
	}

	let { description, onOpen }: Props = $props()
</script>

<InfoTile label="Description" clickable onclick={onOpen} class="description-tile">
	{#if description}
		<DescriptionRenderer content={description} truncate={true} maxLines={4} />
	{:else}
		<span class="empty-state">No description</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/typography' as *;

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
