<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import WeaponTypeahead from '$lib/components/ui/WeaponTypeahead.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getWeaponImage } from '$lib/utils/images'
	import { getElementKey } from '$lib/utils/element'
	import { localizeHref } from '$lib/paraglide/runtime'

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

	const elementKey = $derived(getElementKey(weapon?.element))

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
							{#if index > 0}
								<span class="chain-arrow">
									<Icon name="arrow-down" size={14} />
								</span>
							{/if}
							<a
								href={localizeHref(`/database/weapons/${chainWeapon.granblueId}`)}
								class="chain-item {elementKey}"
								class:current={chainWeapon.granblueId === weapon.granblueId}
							>
								<img
									src={getWeaponImage(
										chainWeapon.granblueId,
										'square',
										weapon.element === 0 ? weapon.element : undefined
									)}
									alt=""
									class="chain-image"
								/>
								<span class="chain-name">{chainWeapon.name?.en || chainWeapon.name?.ja}</span>
							</a>
						{/each}
					</div>
				</DetailItem>
			{/if}

			{#if forgedFrom && forgeChain.length === 0}
				<DetailItem label="Forged From">
					<a
						href={localizeHref(`/database/weapons/${forgedFrom.granblueId}`)}
						class="forged-from-link"
					>
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
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.forge-chain {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: spacing.$unit;
	}

	.chain-item {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-half spacing.$unit-half spacing.$unit-half spacing.$unit-half;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
		text-decoration: none;
		color: var(--text-primary);
		transition: background-color 0.15s ease;
		width: 100%;

		&:hover {
			background: var(--unit-bg-hover);
		}

		&.current {
			margin: spacing.$unit 0;

			&.wind {
				background: var(--wind-nav-hover-bg);
			}
			&.fire {
				background: var(--fire-nav-hover-bg);
			}
			&.water {
				background: var(--water-nav-hover-bg);
			}
			&.earth {
				background: var(--earth-nav-hover-bg);
			}
			&.light {
				background: var(--light-nav-hover-bg);
			}
			&.dark {
				background: var(--dark-nav-hover-bg);
			}
			&.null {
				background: var(--card-bg-hover);
			}
		}
	}

	.chain-image {
		width: 32px;
		height: 32px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}

	.chain-name {
		font-size: typography.$font-small;
	}

	.chain-arrow {
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		align-self: center;
	}

	.forged-from-link {
		display: inline-flex;
		align-items: center;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		color: var(--blue);
		text-decoration: none;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}
</style>
