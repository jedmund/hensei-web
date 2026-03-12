<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import {
		getCharacterDetailImage,
		getWeaponBaseImage,
		getSummonDetailImage,
		getCharacterPose,
		getBasePath
	} from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		itemData: any
		gridUncapLevel: number | null | undefined
		gridTranscendence: number | null | undefined
	}

	let { type, item, itemData, gridUncapLevel, gridTranscendence }: Props = $props()

	// Get image URL based on type using detail/base variants
	function getImageUrl(): string {
		const id = itemData?.granblueId

		if (type === 'character') {
			const isStyle = (item as GridCharacter).character?.styleSwap
			const pose = isStyle ? '01_style' : getCharacterPose(gridUncapLevel ?? undefined, gridTranscendence ?? undefined)
			return getCharacterDetailImage(id, pose)
		} else if (type === 'weapon') {
			return getWeaponBaseImage(id)
		} else {
			return getSummonDetailImage(id)
		}
	}

	// Get element-based background color
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

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') {
			return maybe.en || maybe.ja || '—'
		}
		return '—'
	}

	// Special characters have different star counts (SR characters, etc.)
	const special = $derived(type === 'character' && (itemData?.rarity ?? 3) < 3)

	const ELEMENT_NAMES: Record<number, string> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	const elementName = $derived(ELEMENT_NAMES[itemData?.element] ?? 'null')

	const reliefBackgroundUrl = `${getBasePath()}/relief.png`
</script>

<div class="item-header-container">
	<div
		class="item-header"
		data-type={type}
		style:background-image="url({reliefBackgroundUrl}), linear-gradient(to right, #000, #484440, #000)"
		style:--element-color="var(--{elementName}-bg)"
	>
		<div class="uncap-overlay">
			<UncapIndicator
				{type}
				uncapLevel={gridUncapLevel}
				transcendenceStage={gridTranscendence}
				flb={itemData?.uncap?.flb}
				ulb={itemData?.uncap?.ulb}
				transcendence={itemData?.uncap?.transcendence}
				{special}
				editable={false}
			/>
		</div>
		<img src={getImageUrl()} alt={displayName(itemData)} class="item-image {type}" />
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

			.uncap-overlay {
				position: absolute;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: layout.$item-corner;
				padding: spacing.$unit;
				bottom: spacing.$unit;
				right: spacing.$unit;
				background: rgba(0, 0, 0, 0.24);
				z-index: 2;
			}
		}
	}
</style>
