
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import WeaponTypeahead from '$lib/components/ui/WeaponTypeahead.svelte'
	import { getWeaponGridImage } from '$lib/utils/images'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let { weapon, editMode = false, editData = $bindable() }: Props = $props()

	// Get forge chain for display (only in view mode)
	const forgeChain = $derived(weapon?.forgeChain ?? [])
	const forgedFrom = $derived(weapon?.forgedFrom ?? null)
	const forgeOrder = $derived(weapon?.forgeOrder)

	// Check if weapon has any forge data
	const hasForgeData = $derived(
		forgeChain.length > 0 || forgedFrom != null || forgeOrder != null || editMode
	)

	// Get initial weapon data for typeahead
	const initialForgedFrom = $derived.by(() => {
		if (!forgedFrom) return null
		return {
			id: forgedFrom.id,
			name: forgedFrom.name?.en || forgedFrom.name?.ja || forgedFrom.granblueId,
			granblueId: forgedFrom.granblueId
		}
	})
</script>

{#if hasForgeData}
	<DetailsContainer title="Forge Chain">
		{#if editMode}
			<DetailItem label="Forged From" sublabel="The weapon this was forged from" editable={true}>
				<WeaponTypeahead
					bind:value={editData.forgedFrom}
					initialWeapon={initialForgedFrom}
					placeholder="Search for base weapon..."
					contained
				/>
			</DetailItem>
		{:else}
			{#if forgeChain.length > 0}
				<DetailItem label="Forge Chain">
					<div class="forge-chain">
						{#each forgeChain as chainWeapon, index}
							<a
								href="/database/weapons/{chainWeapon.granblueId}"
								class="chain-item"
								class:current={chainWeapon.granblueId === weapon.granblueId}
							>
								<img
									src={getWeaponGridImage(chainWeapon.granblueId, weapon.element)}
									alt=""
									class="chain-image"
								/>
								<span class="chain-name">{chainWeapon.name?.en || chainWeapon.name?.ja}</span>
								<span class="chain-order">({chainWeapon.forgeOrder})</span>
							</a>
							{#if index < forgeChain.length - 1}
								<span class="chain-arrow">→</span>
							{/if}
						{/each}
					</div>
				</DetailItem>
			{/if}

			{#if forgedFrom && forgeChain.length === 0}
				<DetailItem label="Forged From">
					<a href="/database/weapons/{forgedFrom.granblueId}" class="forged-from-link">
						{forgedFrom.name?.en || forgedFrom.name?.ja}
					</a>
				</DetailItem>
			{/if}

			{#if forgeOrder != null}
				<DetailItem label="Forge Order" value={forgeOrder.toString()} />
			{/if}
		{/if}
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.forge-chain {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		flex-wrap: wrap;
	}

	.chain-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner-small;
		text-decoration: none;
		color: var(--text-primary);
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--card-bg-hover);
		}

		&.current {
			background: var(--blue-subtle);
			outline: 1px solid var(--blue);
		}
	}

	.chain-image {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.chain-name {
		font-size: typography.$font-small;
	}

	.chain-order {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.chain-arrow {
		color: var(--text-tertiary);
	}

	.forged-from-link {
		color: var(--blue);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
