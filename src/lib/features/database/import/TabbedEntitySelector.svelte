<svelte:options runes={true} />

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import { getPlaceholderImage } from '$lib/utils/images'

	export interface EntityTab {
		wikiPage: string
		granblueId?: string
		status: 'loading' | 'success' | 'error'
		imageUrl: string
		error?: string
		saved?: boolean
	}

	interface Props {
		entities: EntityTab[]
		selectedWikiPage: string | null
		onSelect: (wikiPage: string) => void
		entityType: 'character' | 'weapon' | 'summon'
	}

	let { entities, selectedWikiPage, onSelect, entityType }: Props = $props()

	// Get placeholder image based on entity type
	const placeholderImage = $derived(getPlaceholderImage(entityType, 'square'))
</script>

<div class="entity-selector">
	{#each entities as entity}
		<button
			type="button"
			class="entity-tab"
			class:selected={entity.wikiPage === selectedWikiPage}
			class:error={entity.status === 'error'}
			class:loading={entity.status === 'loading'}
			class:saved={entity.saved}
			onclick={() => onSelect(entity.wikiPage)}
			title={entity.error || entity.wikiPage}
			disabled={entity.saved}
		>
			<img
				src={entity.granblueId ? entity.imageUrl : placeholderImage}
				alt={entity.wikiPage}
				class="entity-image"
				class:placeholder={!entity.granblueId}
			/>

			{#if entity.status === 'loading'}
				<span class="status-overlay loading">
					<Icon name="loader-2" size={20} />
				</span>
			{:else if entity.status === 'error'}
				<span class="status-overlay error">
					<Icon name="close" size={20} />
				</span>
			{:else if entity.saved}
				<span class="status-overlay saved">
					<Icon name="check" size={20} />
				</span>
			{/if}
		</button>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.entity-selector {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
		padding: $unit-2x;
		background: $grey-95;
		border-radius: $card-corner;
	}

	.entity-tab {
		position: relative;
		width: 80px;
		height: 80px;
		padding: 0;
		border: 2px solid transparent;
		border-radius: $item-corner;
		background: $grey-90;
		cursor: pointer;
		overflow: hidden;
		transition: border-color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;

		&:hover:not(:disabled) {
			transform: scale(1.05);
			border-color: $grey-60;
		}

		&.selected {
			border-color: $water-text-20;
			box-shadow: 0 0 8px rgba($water-text-20, 0.3);
		}

		&.error {
			border-color: $error;
			opacity: 0.7;
		}

		&.saved {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.entity-image {
		width: 100%;
		height: 100%;
		object-fit: cover;

		&.placeholder {
			opacity: 0.3;
		}
	}

	.status-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(black, 0.7);

		&.loading {
			color: white;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}

		&.error {
			color: $error;
		}

		&.saved {
			color: $wind-text-20;
			background: rgba($wind-text-20, 0.2);
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
