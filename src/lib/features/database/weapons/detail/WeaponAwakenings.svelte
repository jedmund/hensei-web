<script lang="ts">
	// The weapon's awakenings, in game order
	import { getAwakeningImage } from '$lib/utils/modifiers'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'
	import type { Awakening } from '$lib/types/api/entities'

	let { record }: { record: Weapon } = $props()

	// The full view sends whole awakenings; the adapter type lists only a few fields
	const awakenings = $derived(
		[...((record.awakenings ?? []) as unknown as Awakening[])].sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0)
		)
	)
</script>

<div class="awakening-list">
	{#each awakenings as awakening (awakening.id)}
		{@const imageUrl = getAwakeningImage({ type: awakening })}
		<div class="awakening-item">
			{#if imageUrl}
				<img src={imageUrl} alt={awakening.name?.en ?? awakening.slug} class="awakening-icon" />
			{:else}
				<div class="awakening-icon placeholder"></div>
			{/if}
			<span class="awakening-name">{awakening.name?.en ?? awakening.slug}</span>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.awakening-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.awakening-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--background);
		border-radius: layout.$item-corner-small;
	}

	.awakening-icon {
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;

		&.placeholder {
			background: var(--separator-bg);
		}
	}

	.awakening-name {
		font-size: typography.$font-regular;
		color: var(--text-primary);
		font-weight: typography.$medium;
	}
</style>
