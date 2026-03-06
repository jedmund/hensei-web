<script lang="ts">
	import type { GridWeapon } from '$lib/types/api/party'
	import type { Party } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getWeaponImage } from '$lib/features/database/detail/image'
	import { getPlaceholderImage } from '$lib/utils/images'
	import { openDetailsSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { getAwakeningImage, getWeaponKeyImages, getAxSkillImages } from '$lib/utils/modifiers'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { GridType } from '$lib/types/enums'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		item?: GridWeapon | undefined
		position: number
		notInCollection?: boolean
	}

	let { item, position, notInCollection = false }: Props = $props()

	type PartyCtx = {
		getParty: () => Party
		updateParty: (p: Party) => void
		canEdit: () => boolean
		getEditKey: () => string | null
		getSelectedSlot?: () => number
		getActiveTab?: () => GridType
		services: { gridService: any; partyService: any }
		openPicker?: (opts: { type: 'weapon' | 'summon' | 'character'; position: number; item?: any }) => void
	}

	const ctx = getContext<PartyCtx>('party')

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	// Use $derived to ensure consistent computation between server and client
	let imageUrl = $derived.by(() => {
		const isMain = position === -1 || item?.mainhand
		const variant = isMain ? 'main' : 'grid'

		// For element-changeable weapons (element === 0), use instance element or default to 0 (no element image)
		const element = item?.weapon?.element === 0 ? (item?.element ?? 0) : undefined

		return getWeaponImage(item?.weapon?.granblueId, variant, element)
	})

	// Get awakening image URL using utility
	let awakeningImage = $derived(getAwakeningImage(item?.awakening))

	// Get weapon key images using utility
	let weaponKeyImages = $derived(
		getWeaponKeyImages(
			item?.weaponKeys,
			item?.weapon?.element,
			item?.weapon?.proficiency,
			item?.weapon?.series,
			item?.weapon?.name
		)
	)

	// Get AX skill images using utility
	let axSkillImages = $derived(getAxSkillImages(item?.ax))

	// Check if this item is currently active in the sidebar
	let isActive = $derived(item?.id && sidebar.activeItemId === String(item.id))

	// Check if this empty slot is currently selected for adding an item
	let isEmptySelected = $derived(
		!item &&
			ctx?.getSelectedSlot?.() === position &&
			ctx?.getActiveTab?.() === GridType.Weapon
	)

	// Determine element class for focus ring
	let elementClass = $derived.by(() => {
		// For weapons with null element that have an instance element, use it
		const element =
			item?.weapon?.element === 0 && item?.element ? item.element : item?.weapon?.element

		switch (element) {
			case 1:
				return 'wind'
			case 2:
				return 'fire'
			case 3:
				return 'water'
			case 4:
				return 'earth'
			case 5:
				return 'dark'
			case 6:
				return 'light'
			default:
				return 'neutral'
		}
	})

	async function remove() {
		if (!item?.id) return
		try {
			const party = ctx.getParty()
			const editKey = ctx.getEditKey()
			const updated = await ctx.services.gridService.removeWeapon(
				party.id,
				item.id as any,
				editKey || undefined
			)
			if (updated) {
				ctx.updateParty(updated)
			}
		} catch (err) {
			console.error('Error removing weapon:', err)
		}
	}

	function viewDetails() {
		if (!item) return
		openDetailsSidebar({
			type: 'weapon',
			item
		})
	}

	function replace() {
		if (ctx?.openPicker) {
			ctx.openPicker({ type: 'weapon', position, item })
		}
	}

	function viewInDatabase() {
		if (!item?.weapon?.granblueId) return
		goto(`/database/weapons/${item.weapon.granblueId}`)
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(($page.data.account?.role ?? 0) >= 7)
</script>

<div
	class="unit {elementClass}"
	class:empty={!item}
	class:extra={position >= 9}
	class:is-active={isActive}
	class:orphaned={item?.orphaned}
>
	{#if item}
		<UnitMenuContainer showGearButton={true}>
			{#snippet trigger()}
				<div
					class="focus-ring-wrapper {elementClass}"
					class:is-active={isActive}
					class:editable={ctx?.canEdit()}
					class:main={item?.mainhand || position === -1}
				>
					{#key item?.id ?? position}
						<div
							class="frame weapon {elementClass}"
							class:main={item?.mainhand || position === -1}
							class:cell={!(item?.mainhand || position === -1)}
							class:extra={position >= 9}
							class:editable={ctx?.canEdit()}
							class:is-active={isActive}
							class:not-in-collection={notInCollection}
							onclick={() => viewDetails()}
						>
							<div class="modifiers">
								{#if item?.orphaned}
									<div class="orphaned-badge" title="This item is no longer in your collection">
										<Icon name="alertTriangle" size={16} />
									</div>
								{/if}
								{#if awakeningImage}
									<img
										class="awakening"
										src={awakeningImage}
										alt={`${item?.awakening?.type?.name?.en || 'Awakening'} Lv${item?.awakening?.level || 0}`}
									/>
								{/if}
								<div class="skills">
									{#each axSkillImages as skill}
										<img class="skill" src={skill.url} alt={skill.alt} />
									{/each}
									{#each weaponKeyImages as skill}
										<img class="skill" src={skill.url} alt={skill.alt} />
									{/each}
								</div>
							</div>
							<img
								class="image {elementClass}"
								class:placeholder={!item?.weapon?.granblueId}
								class:not-in-collection={notInCollection}
								alt={displayName(item?.weapon)}
								src={imageUrl}
							/>
						</div>
					{/key}
				</div>
			{/snippet}

			{#snippet contextMenu()}
				<MenuItems
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="context"
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					replaceLabel={m.context_replace()}
					removeLabel={m.context_remove()}
				/>
			{/snippet}

			{#snippet dropdownMenu()}
				<MenuItems
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="dropdown"
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					replaceLabel={m.context_replace()}
					removeLabel={m.context_remove()}
				/>
			{/snippet}
		</UnitMenuContainer>
	{:else}
		{#key `empty-${position}`}
			<div
				class="frame weapon"
				class:main={position === -1}
				class:cell={position !== -1}
				class:extra={position >= 9}
				class:editable={ctx?.canEdit()}
				class:is-selected={isEmptySelected}
				onclick={() =>
					ctx?.canEdit() && ctx?.openPicker && ctx.openPicker({ type: 'weapon', position, item })}
			>
				<img
					class="image placeholder"
					alt=""
					src={getPlaceholderImage('weapon', position === -1 ? 'main' : 'grid')}
				/>
				{#if ctx?.canEdit()}
					<span class="icon">
						<Icon name="plus" size={24} />
					</span>
				{/if}
			</div>
		{/key}
	{/if}
	{#if item}
		<UncapIndicator
			type="weapon"
			uncapLevel={item.uncapLevel}
			transcendenceStage={item.transcendenceStep}
			flb={item.weapon?.uncap?.flb}
			ulb={item.weapon?.uncap?.ulb}
			transcendence={item.weapon?.uncap?.transcendence}
			editable={ctx?.canEdit()}
			updateUncap={async (level) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					const updated = await ctx.services.gridService.updateWeaponUncap(
						item.id,
						level,
						undefined,
						editKey || undefined
					)
					if (updated) {
						ctx.updateParty(updated)
					}
				} catch (err) {
					console.error('Failed to update weapon uncap:', err)
					// TODO: Show user-friendly error notification
				}
			}}
			updateTranscendence={async (stage) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					// When setting transcendence > 0, also set uncap to max (6)
					const maxUncap = stage > 0 ? 6 : undefined
					const updated = await ctx.services.gridService.updateWeaponUncap(
						item.id,
						maxUncap,
						stage,
						editKey || undefined
					)
					if (updated) {
						ctx.updateParty(updated)
					}
				} catch (err) {
					console.error('Failed to update weapon transcendence:', err)
					// TODO: Show user-friendly error notification
				}
			}}
		/>
	{/if}
	<div class="name" class:not-in-collection={notInCollection}>{item ? displayName(item?.weapon) : ''}</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;

	.unit {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;

		&.empty .name {
			display: none;
		}

		&.extra {
			.frame {
				background: var(--extra-purple-card-bg);
			}

			.icon {
				color: var(--extra-purple-secondary);
			}

			&:hover .icon {
				color: var(--extra-purple-primary);
			}

			.name {
				font-weight: typography.$medium;
				color: var(--extra-purple-text);
			}
		}
	}

	.focus-ring-wrapper {
		position: relative;
		display: block;
		transition: transform 0.2s ease-in-out;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: 8px;
			pointer-events: none;
			z-index: 10;
		}

		&.editable:hover {
			transform: layout.$scale-wide;
		}

		&.editable.main:hover {
			transform: layout.$scale-tall;
		}
	}

	.frame {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 8px;
		background: var(--card-bg, #f5f5f5);
		transition: opacity 0.2s ease-in-out;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&.editable:hover {
			opacity: 0.95;
			box-shadow: var(--shadow-sm);
		}

		// Slot selection - subtle dark pulsing glow (works for both empty and filled)
		&.is-selected,
		&.is-active {
			animation: pulse-slot-shadow 2s ease-in-out infinite;
		}
	}

	@keyframes pulse-slot-shadow {
		0%,
		100% {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 0 4px 2px rgba(0, 0, 0, 0.06);
		}
		50% {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.24), 0 0 8px 4px rgba(0, 0, 0, 0.12);
		}
	}

	.frame.weapon.main {
		@include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h);
	}

	.frame.weapon.cell {
		@include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h);
	}

	.image {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		z-index: 2;

		&.placeholder {
			opacity: 0;
		}

		&.not-in-collection {
			opacity: 0.6;
		}
	}

	.frame.not-in-collection::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 2px solid colors.$error;
		border-radius: inherit;
		z-index: 2;
		pointer-events: none;
	}

	.icon {
		position: absolute;
		z-index: 1;
		color: var(--icon-secondary, #999);
		transition: color 0.2s ease-in-out;
	}

	.frame.editable:hover .icon {
		color: var(--icon-secondary-hover, #666);
	}

	.name {
		font-size: typography.$font-small;
		text-align: center;
		color: var(--text-secondary);

		&.not-in-collection {
			color: colors.$error;
		}
	}

	.modifiers {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: 3;
		pointer-events: none;

		.orphaned-badge {
			position: absolute;
			top: 4px;
			right: 4px;
			width: 24px;
			height: 24px;
			background: colors.$error;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			z-index: 10;
			pointer-events: auto;
			cursor: help;
			box-shadow: var(--shadow-sm);
		}

		.awakening {
			position: absolute;
			width: 30%;
			height: auto;
		}

		.skills {
			position: absolute;
			display: flex;
			gap: calc(spacing.$unit / 4);
			padding: calc(spacing.$unit / 2);

			.skill {
				width: 20%;
				height: auto;
			}
		}
	}

	// Orphaned state
	.unit.orphaned {
		.frame {
			opacity: 0.7;
			border: 2px solid colors.$error;
		}

		.name {
			color: colors.$error;
		}
	}

	// Position modifiers for grid weapons
	.frame.weapon.cell {
		.awakening {
			top: 14%;
			left: -3.5%;
		}

		.skills {
			bottom: 2%;
			right: 2%;
			justify-content: flex-end;
		}
	}

	// Position modifiers for main weapons
	.frame.weapon.main {
		.awakening {
			width: 40%;
			top: 67%;
			left: -3.5%;
		}

		.skills {
			bottom: 12%;
			right: -3.5%;
			justify-content: flex-end;

			.skill {
				width: 25%;
			}
		}
	}

	// Pulsing focus ring animation
	@keyframes pulse-focus-ring {
		0%,
		100% {
			box-shadow: 0 0 4px 3px currentColor;
		}
		50% {
			box-shadow: 0 0 4px 6px currentColor;
		}
	}

	// Element-specific focus rings
	.focus-ring-wrapper.is-active::before {
		animation: pulse-focus-ring 2s ease-in-out infinite;
	}

	.focus-ring-wrapper.is-active {
		&.fire::before {
			@include colors.focus-ring-fire();
			color: rgba(250, 109, 109, 0.2);
		}

		&.water::before {
			@include colors.focus-ring-water();
			color: rgba(108, 201, 255, 0.2);
		}

		&.earth::before {
			@include colors.focus-ring-earth();
			color: rgba(253, 159, 91, 0.2);
		}

		&.wind::before {
			@include colors.focus-ring-wind();
			color: rgba(62, 228, 137, 0.2);
		}

		&.light::before {
			@include colors.focus-ring-light();
			color: rgba(232, 214, 51, 0.2);
		}

		&.dark::before {
			@include colors.focus-ring-dark();
			color: rgba(222, 123, 255, 0.2);
		}

		&.neutral::before {
			@include colors.focus-ring-neutral();
			color: rgba(0, 0, 0, 0.1);
		}
	}

	// Element-specific name colors when active
	.unit.is-active {
		.name {
			font-weight: typography.$bold;
		}

		&.fire .name {
			color: colors.$fire--text--light;
		}

		&.water .name {
			color: colors.$water--text--light;
		}

		&.earth .name {
			color: colors.$earth--text--light;
		}

		&.wind .name {
			color: colors.$wind--text--light;
		}

		&.light .name {
			color: colors.$light--text--light;
		}

		&.dark .name {
			color: colors.$dark--text--light;
		}

		&.neutral .name {
			color: var(--text-secondary);
		}
	}
</style>
