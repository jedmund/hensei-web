<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import type { Party } from '$lib/types/api/party'
	import type { Job } from '$lib/types/api/entities'
	import { getContext } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import { openDetailsSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { getJobPortraitUrl, Gender } from '$lib/utils/jobUtils'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import perpetuityEmpty from '$src/assets/icons/perpetuity/empty.svg'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		item?: GridCharacter
		position: number
		mainWeaponElement?: number | null
		partyElement?: number | null
		job?: Job
	}

	let { item, position, mainWeaponElement, partyElement, job }: Props = $props()

	type PartyCtx = {
		getParty: () => Party
		updateParty: (p: Party) => void
		canEdit: () => boolean
		getEditKey: () => string | null
		services: { gridService: any; partyService: any }
		openPicker?: (opts: {
			type: 'character' | 'weapon' | 'summon'
			position: number
			item?: any
		}) => void
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
		// For protagonist slot (position 0) with a job, show job portrait
		if (position === 0 && job) {
			return getJobPortraitUrl(job, Gender.Gran) // TODO: Get gender from user preferences
		}

		// If no item or no character with granblueId, return placeholder
		if (!item || !item.character?.granblueId) {
			return getCharacterImageWithPose(null, 'main', 0, 0)
		}

		return getCharacterImageWithPose(
			item.character.granblueId,
			'main',
			item?.uncapLevel ?? 0,
			item?.transcendenceStep ?? 0,
			mainWeaponElement,
			partyElement
		)
	})

	// Check if this is the protagonist slot
	const isProtagonist = $derived(position === 0)

	// Check if this item is currently active in the sidebar
	let isActive = $derived(item?.id && sidebar.activeItemId === String(item.id))

	// Determine element class for focus ring
	let elementClass = $derived.by(() => {
		const element = item?.character?.element || partyElement

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
			const updated = await ctx.services.gridService.removeCharacter(
				party.id,
				item.id as any,
				editKey || undefined
			)
			if (updated) {
				ctx.updateParty(updated)
			}
		} catch (err) {
			console.error('Error removing character:', err)
		}
	}

	function viewDetails() {
		if (!item) return
		openDetailsSidebar({
			type: 'character',
			item
		})
	}

	function replace() {
		if (ctx?.openPicker) {
			ctx.openPicker({ type: 'character', position, item })
		}
	}

	async function togglePerpetuity(e: Event) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return

		try {
			const party = ctx.getParty()
			const editKey = ctx.getEditKey()
			// Update the character on the server
			const updatedCharacter = await ctx.services.gridService.updateCharacter(
				party.id,
				item.id,
				{ perpetuity: !item.perpetuity },
				editKey || undefined
			)

			if (updatedCharacter) {
				// The API returns 'object' but we need 'character'
				const fixedCharacter = {
					...updatedCharacter,
					character: updatedCharacter.object,
					object: undefined
				}

				// Update the party locally with the new character data
				const updatedParty = {
					...party,
					characters: party.characters.map((char) =>
						char.id === fixedCharacter.id ? fixedCharacter : char
					)
				}
				ctx.updateParty(updatedParty)
			}
		} catch (err) {
			console.error('Error toggling perpetuity:', err)
		}
	}
</script>

<div class="unit {elementClass}" class:empty={!item} class:is-active={isActive}>
	{#if item}
		<UnitMenuContainer showGearButton={true}>
			{#snippet trigger()}
				<div
					class="focus-ring-wrapper {elementClass}"
					class:is-active={isActive}
					class:editable={ctx?.canEdit()}
				>
					{#key item?.id ?? position}
						<div
							class="frame character cell {elementClass}"
							class:protagonist={position === 0}
							class:editable={ctx?.canEdit()}
							onclick={() => viewDetails()}
						>
							{#if position !== 0}
								{#if ctx?.canEdit()}
									<button
										class="perpetuity"
										class:active={item.perpetuity}
										onclick={togglePerpetuity}
										title={item.perpetuity ? 'Remove Perpetuity Ring' : 'Add Perpetuity Ring'}
									>
										<img
											class="perpetuity-icon filled"
											src={perpetuityFilled}
											alt="Perpetuity Ring"
										/>
										<img
											class="perpetuity-icon empty"
											src={perpetuityEmpty}
											alt="Add Perpetuity Ring"
										/>
									</button>
								{:else if item.perpetuity}
									<img
										class="perpetuity static"
										src={perpetuityFilled}
										alt="Perpetuity Ring"
										title="Perpetuity Ring"
									/>
								{/if}
							{/if}
							<img
								class="image {elementClass}"
								class:placeholder={!item?.character?.granblueId && !isProtagonist}
								class:protagonist={isProtagonist}
								alt={isProtagonist && job ? job.name.en : displayName(item?.character)}
								src={imageUrl}
							/>
						</div>
					{/key}
				</div>
			{/snippet}

			{#snippet contextMenu()}
				<MenuItems
					onViewDetails={viewDetails}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="context"
					viewDetailsLabel={m.context_view_details()}
					replaceLabel={m.context_replace()}
					removeLabel={m.context_remove()}
				/>
			{/snippet}

			{#snippet dropdownMenu()}
				<MenuItems
					onViewDetails={viewDetails}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="dropdown"
					viewDetailsLabel={m.context_view_details()}
					replaceLabel={m.context_replace()}
					removeLabel={m.context_remove()}
				/>
			{/snippet}
		</UnitMenuContainer>
	{:else}
		{#key `empty-${position}`}
			<div
				class="frame character cell"
				class:editable={ctx?.canEdit() && !isProtagonist}
				class:protagonist={isProtagonist}
				onclick={() =>
					!isProtagonist &&
					ctx?.canEdit() &&
					ctx?.openPicker &&
					ctx.openPicker({ type: 'character', position, item })}
			>
				<img
					class="image"
					class:placeholder={!isProtagonist || !job}
					class:protagonist={isProtagonist}
					alt={isProtagonist && job ? job.name.en : ''}
					src={isProtagonist ? imageUrl : '/images/placeholders/placeholder-weapon-grid.png'}
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
			type="character"
			uncapLevel={item.uncapLevel}
			transcendenceStage={item.transcendenceStep}
			special={item.character?.special}
			flb={item.character?.uncap?.flb}
			ulb={item.character?.uncap?.ulb}
			transcendence={!item.character?.special && item.character?.uncap?.ulb}
			editable={ctx?.canEdit()}
			updateUncap={async (level) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					const updated = await ctx.services.gridService.updateCharacterUncap(
						item.id,
						level,
						undefined,
						editKey || undefined
					)
					if (updated) {
						ctx.updateParty(updated)
					}
				} catch (err) {
					console.error('Failed to update character uncap:', err)
					// TODO: Show user-friendly error notification
				}
			}}
			updateTranscendence={async (stage) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					// When setting transcendence > 0, also set uncap to max (6)
					const maxUncap = stage > 0 ? 6 : undefined
					const updated = await ctx.services.gridService.updateCharacterUncap(
						item.id,
						maxUncap,
						stage,
						editKey || undefined
					)
					if (updated) {
						ctx.updateParty(updated)
					}
				} catch (err) {
					console.error('Failed to update character transcendence:', err)
					// TODO: Show user-friendly error notification
				}
			}}
		/>
	{/if}
	<div class="name">{item ? displayName(item?.character) : ''}</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
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
			transform: scale(1.05);
		}
	}

	.frame {
		position: relative;
		width: 100%;
		border-radius: 8px;
		background: var(--card-bg, #f5f5f5);
		transition: opacity 0.2s ease-in-out;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&.editable:hover {
			opacity: 0.95;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	}

	.frame.character.cell {
		@include rep.aspect(rep.$char-cell-w, rep.$char-cell-h);

		&.protagonist {
			background-image: url('/images/relief.png'), linear-gradient(to right, #000, #484440, #000);
			background-size: cover;
			background-position: center -20px;
			background-repeat: no-repeat;
		}
	}

	.image {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		z-index: 2;
		border-radius: 8px;

		&.placeholder {
			opacity: 0;
		}

		&.protagonist {
			object-fit: cover;
			opacity: 1;
		}
	}

	.frame.protagonist {
		// Protagonist slot may have different aspect ratio for job portraits
		.image {
			object-fit: cover;
		}
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
		color: colors.$grey-50;
	}

	.perpetuity {
		position: absolute;
		z-index: 40;
		top: calc(spacing.$unit * -1);
		right: spacing.$unit-3x;
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.1);
		}

		&.static {
			cursor: default;
			&:hover {
				transform: none;
			}
		}
	}

	.perpetuity-icon {
		width: 100%;
		height: 100%;
		display: block;

		&.filled {
			display: none;
		}

		&.empty {
			display: block;
		}
	}

	.perpetuity.active {
		.perpetuity-icon.filled {
			display: block;
		}

		.perpetuity-icon.empty {
			display: none;
		}

		&:hover {
			.perpetuity-icon.filled {
				display: none;
			}

			.perpetuity-icon.empty {
				display: block;
			}
		}
	}

	.perpetuity:not(.active):hover {
		.perpetuity-icon.filled {
			display: block;
		}

		.perpetuity-icon.empty {
			display: none;
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
			color: colors.$grey-40;
		}
	}
</style>
