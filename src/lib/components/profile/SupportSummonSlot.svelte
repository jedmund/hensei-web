<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import { getSummonImage, getSummonTransformation } from '$lib/utils/images'
	import type { SupportSummon, SupportSummonSection } from '$lib/types/api/supportSummon'

	interface Props {
		section: SupportSummonSection
		position: number
		summon?: SupportSummon | undefined
		isOwner?: boolean
		onSelect?: ((section: SupportSummonSection, position: number) => void) | undefined
	}

	let { section, position, summon, isOwner = false, onSelect }: Props = $props()

	const variant = $derived<'main' | 'grid'>(section === 'misc' ? 'grid' : 'main')

	const imageUrl = $derived.by(() => {
		if (!summon) return undefined
		const cs = summon.collectionSummon
		const transformation = getSummonTransformation(
			cs.summon?.granblueId,
			cs.uncapLevel,
			cs.transcendenceStep
		)
		return getSummonImage(cs.summon?.granblueId, variant, transformation)
	})

	const interactive = $derived(isOwner && !!onSelect)

	function handleClick() {
		if (!interactive) return
		onSelect?.(section, position)
	}

	function handleKey(event: KeyboardEvent) {
		if (!interactive) return
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onSelect?.(section, position)
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="slot"
	class:misc={section === 'misc'}
	class:interactive
	class:filled={!!summon}
	role={interactive ? 'button' : undefined}
	tabindex={interactive ? 0 : undefined}
	onclick={handleClick}
	onkeydown={handleKey}
>
	{#if imageUrl}
		<img
			class="image"
			src={imageUrl}
			alt={summon?.collectionSummon.summon?.name?.en ?? ''}
			loading="lazy"
		/>
	{:else}
		<div class="placeholder" aria-hidden="true"></div>
		{#if interactive}
			<span class="add-icon" aria-hidden="true">
				<Icon name="plus" size={24} />
			</span>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;

	.slot {
		width: 100%;
		aspect-ratio: 196 / 340; // summon-main artwork
		border-radius: $card-corner;
		overflow: hidden;
		background: var(--placeholder-bg, rgba(0, 0, 0, 0.05));
		position: relative;
		transition: outline-color effects.$duration-quick ease;
		outline: 2px solid transparent;
		outline-offset: 2px;

		&.misc {
			aspect-ratio: 184 / 138; // summon-grid artwork
		}

		&.interactive {
			cursor: pointer;

			&:hover {
				outline-color: var(--focus-ring, rgba(0, 0, 0, 0.15));
			}

			&:focus-visible {
				outline-color: var(--focus-ring);
			}
		}
	}

	.image,
	.placeholder {
		width: 100%;
		height: 100%;
		display: block;
	}

	.image {
		object-fit: cover;
	}

	.placeholder {
		background: transparent;
	}

	// Centered + icon for empty interactive slots — matches the styling on
	// empty `SummonUnit` slots.
	.add-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--icon-secondary, #999);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		transition: color effects.$duration-quick ease;
	}

	.slot.interactive:hover .add-icon {
		color: var(--icon-secondary-hover, #666);
	}
</style>
