<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import {
		getCharacterDetailImage,
		getWeaponBaseImage,
		getSummonDetailImage,
		getCharacterPose
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
			const pose = getCharacterPose(gridUncapLevel, gridTranscendence)
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
</script>

<div class="item-header-container">
	<div class="item-header">
		<div class="uncap-overlay">
			<UncapIndicator
				{type}
				uncapLevel={gridUncapLevel}
				transcendenceStage={gridTranscendence}
				flb={itemData?.uncap?.flb}
				ulb={itemData?.uncap?.ulb}
				transcendence={itemData?.uncap?.transcendence}
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
			background: url('/images/relief.png'), linear-gradient(to right, #000, #484440, #000);
			background-size: 420px 731px;
			background-position: -20px -20px;
			transition: background 0.3s ease;
			position: relative;
			overflow: hidden;

			.item-image.weapon {
				width: 80%;
				transform: rotate(-15deg);
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
			}
		}
	}
</style>
