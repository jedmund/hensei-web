<script lang="ts">
	// The forge chain the weapon belongs to, or the weapon it's forged from
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getWeaponImage } from '$lib/utils/images/weapons'
	import { getElementKey } from '$lib/utils/element'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'
	import type { Weapon as WeaponEntity } from '$lib/types/api/entities'

	let { record }: { record: Weapon & Pick<WeaponEntity, 'forgeChain'> } = $props()

	const forgeChain = $derived(record.forgeChain ?? [])
	const elementKey = $derived(getElementKey(record.element))
</script>

{#if forgeChain.length > 0}
	<DetailItem label={m.db_weapons_field_forge_chain()}>
		<div class="forge-chain">
			{#each forgeChain as chainWeapon, index (chainWeapon.granblueId)}
				{#if index > 0}
					<span class="chain-arrow">
						<Icon name="arrow-down" size={14} />
					</span>
				{/if}
				<a
					href={localizeHref(`/database/weapons/${chainWeapon.granblueId}`)}
					class="chain-item {elementKey}"
					class:current={chainWeapon.granblueId === record.granblueId}
				>
					<img
						src={getWeaponImage(
							chainWeapon.granblueId,
							'square',
							record.element === 0 ? record.element : undefined
						)}
						alt=""
						class="chain-image"
					/>
					<span class="chain-name">{chainWeapon.name?.en || chainWeapon.name?.ja}</span>
				</a>
			{/each}
		</div>
	</DetailItem>
{:else if record.forgedFrom}
	<DetailItem label={m.db_weapons_field_forged_from()}>
		<a
			href={localizeHref(`/database/weapons/${record.forgedFrom.granblueId}`)}
			class="forged-from-link"
		>
			{record.forgedFrom.name?.en || record.forgedFrom.name?.ja}
		</a>
	</DetailItem>
{/if}

{#if record.forgeOrder != null}
	<DetailItem label={m.db_weapons_field_forge_order()} value={record.forgeOrder.toString()} />
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
