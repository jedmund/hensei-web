<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import {
		getCharacterDetailImage,
		getWeaponBaseImage,
		getSummonDetailImage,
		getCharacterPose,
		getSummonTransformation,
		getWeaponTransformation,
		getBasePath
	} from '$lib/utils/images'
	import { getSimplePortraits } from '$lib/stores/simplePortraits.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getElementKey } from '$lib/utils/element'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import CollectionPill from './CollectionPill.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data from API
		itemData: any
		gridUncapLevel: number | null | undefined
		gridTranscendence: number | null | undefined
		/** When set, renders a Collection pill in the bottom-left of the image area. */
		collectionPill?:
			| {
					count: number
					gridCount?: number | undefined
					isLimitItem?: boolean
					sourceUsername?: string | undefined
					isOutOfSync?: boolean
			  }
			| undefined
	}

	let { type, item, itemData, gridUncapLevel, gridTranscendence, collectionPill }: Props = $props()

	const hasPerpetuity = $derived(type === 'character' && !!(item as GridCharacter).perpetuity)

	const simplePortraits = getSimplePortraits()

	// Get image URL based on type using detail/base variants
	function getImageUrl(): string {
		const id = itemData?.granblueId

		if (type === 'character') {
			const isStyle = (item as GridCharacter).character?.styleSwap
			const pose = isStyle
				? '01_style'
				: getCharacterPose(
						gridUncapLevel ?? undefined,
						gridTranscendence ?? undefined,
						simplePortraits.value
					)
			return getCharacterDetailImage(id, pose)
		} else if (type === 'weapon') {
			const transformation = getWeaponTransformation(
				!!itemData?.uncap?.transcendence,
				gridUncapLevel ?? undefined,
				gridTranscendence ?? undefined
			)
			return getWeaponBaseImage(id, transformation)
		} else {
			const transformation = getSummonTransformation(
				id,
				gridUncapLevel ?? undefined,
				gridTranscendence ?? undefined
			)
			return getSummonDetailImage(id, transformation)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future use
	function getElementBackground(): string {
		const element = itemData?.element
		switch (element) {
			case 1:
				return 'var(--wind-item-detail-bg)'
			case 2:
				return 'var(--fire-item-detail-bg)'
			case 3:
				return 'var(--water-item-detail-bg)'
			case 4:
				return 'var(--earth-item-detail-bg)'
			case 5:
				return 'var(--dark-item-detail-bg)'
			case 6:
				return 'var(--light-item-detail-bg)'
			default:
				return 'var(--null-item-detail-bg)'
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data
	function displayName(input: any): string {
		if (!input) return '—'
		const name = input.name ?? input
		return localizedName(name)
	}

	const elementName = $derived(getElementKey(itemData?.element))

	const reliefBackgroundUrl = `${getBasePath()}/app/marketing/relief.png`
</script>

<div class="item-header-container">
	<div
		class="item-header"
		data-type={type}
		style:background-image="url({reliefBackgroundUrl}), linear-gradient(to right, #000, #484440,
		#000)"
		style:--element-color="var(--{elementName}-bg)"
	>
		<img src={getImageUrl()} alt={displayName(itemData)} class="item-image {type}" />
		{#if hasPerpetuity}
			<img
				src={perpetuityFilled}
				alt="Perpetuity Ring"
				class="perpetuity-overlay"
				aria-label="Perpetuity Ring"
			/>
		{/if}
		{#if collectionPill}
			<div class="collection-pill-slot">
				<CollectionPill
					{type}
					element={itemData?.element}
					count={collectionPill.count}
					gridCount={collectionPill.gridCount}
					isLimitItem={collectionPill.isLimitItem}
					sourceUsername={collectionPill.sourceUsername}
					isOutOfSync={collectionPill.isOutOfSync}
				/>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;

	.item-header-container {
		padding: 0 spacing.$unit-2x;

		.item-header {
			display: flex;
			gap: spacing.$unit-2x;
			align-items: flex-start;
			border-radius: layout.$card-corner;
			align-items: center;
			justify-content: center;
			background-size: 420px 731px;
			background-position: -20px -20px;
			transition: background 0.3s ease;
			position: relative;
			overflow: hidden;

			.item-image.weapon {
				width: 80%;
				transform: rotate(-15deg);
				transition: transform 0.3s ease;
			}

			&:hover .item-image.weapon {
				animation: weapon-float 5s ease-in-out infinite;
			}

			@keyframes weapon-float {
				0%,
				100% {
					transform: rotate(-15deg) translateY(0);
				}
				50% {
					transform: rotate(-15deg) translateY(-6px);
				}
			}

			&:hover .item-image.character,
			&:hover .item-image.summon {
				animation: character-float 5s ease-in-out infinite;
			}

			@keyframes character-float {
				0%,
				100% {
					transform: translateY(0);
				}
				50% {
					transform: translateY(-3px);
				}
			}

			&[data-type='character'],
			&[data-type='summon'] {
				&::after {
					content: '';
					position: absolute;
					inset: 0;
					opacity: 0;
					transition: opacity 0.4s ease;
					pointer-events: none;
					box-shadow:
						inset 0 0 12px 4px rgba(0, 0, 0, 0.4),
						inset 0 0 20px 7px color-mix(in srgb, var(--element-color) 70%, transparent);
					z-index: 1;
				}

				&:hover::after {
					opacity: 0.6;
					animation: element-glow 3s ease-in-out 0.4s infinite;
				}
			}

			@keyframes element-glow-in {
				from {
					opacity: 0;
				}
				to {
					opacity: 0.6;
				}
			}

			@keyframes element-glow {
				0%,
				100% {
					opacity: 0.6;
				}
				50% {
					opacity: 1;
				}
			}

			.item-image.summon,
			.item-image.character {
				width: 100%;
			}

			.perpetuity-overlay {
				position: absolute;
				top: spacing.$unit;
				right: spacing.$unit;
				width: 28px;
				height: 28px;
				object-fit: contain;
				z-index: 2;
				pointer-events: none;
			}

			.collection-pill-slot {
				position: absolute;
				bottom: spacing.$unit;
				left: spacing.$unit;
				z-index: 2;
			}
		}
	}
</style>
