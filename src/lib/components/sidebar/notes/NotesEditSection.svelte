<script lang="ts">
	/**
	 * Editable Notes section: (characters only) role multi-select, plus rich-text
	 * description and substitutions list shared across all grid types. Embedded
	 * in the Notes tab of any per-slot edit pane. Reads from the live party
	 * query so substitution mutations update inline; writes via the existing
	 * grid-item and substitution mutations.
	 */
	import type {
		GridCharacter,
		GridWeapon,
		GridSummon,
		Role,
		Substitution,
		Description
	} from '$lib/types/api/party'
	import { createQuery } from '@tanstack/svelte-query'
	import { roleQueries } from '$lib/api/queries/role.queries'
	import { getRoleIconUrl } from '$lib/utils/roles'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import {
		useCreateSubstitution,
		useUpdateSubstitution,
		useDeleteSubstitution
	} from '$lib/api/mutations/substitution.mutations'
	import {
		useUpdateGridWeapon,
		useUpdateGridCharacter,
		useUpdateGridSummon
	} from '$lib/api/mutations/grid.mutations'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CollectionBadge from '$lib/components/CollectionBadge.svelte'
	import DescriptionEditor from './DescriptionEditor.svelte'
	import { localizedName } from '$lib/utils/locale'
	import {
		getCharacterImage,
		getWeaponImage,
		getSummonImage,
		getPlaceholder
	} from '$lib/features/database/detail/image'
	import { getWeaponFallbackImage, handleImageFallback, STYLE_SWAP_POSE } from '$lib/utils/images'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { AddItemResult } from '$lib/types/api/search'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		partyId?: string
		partyShortcode?: string
	}

	let { type, item, partyId, partyShortcode }: Props = $props()

	const ROLE_CAP = 3
	const SUBSTITUTION_CAP = 10

	// Subscribe to the live party query so this section reflects mutations to
	// substitutions / roles / description immediately rather than reading the
	// stale snapshot the parent passed in.
	const partyQuery = createQuery(() => ({
		...partyQueries.byShortcode(partyShortcode ?? ''),
		enabled: !!partyShortcode
	}))

	const liveItem = $derived.by((): GridCharacter | GridWeapon | GridSummon | undefined => {
		const party = partyQuery.data
		if (!party || !item.id) return undefined
		const list =
			type === 'character' ? party.characters : type === 'summon' ? party.summons : party.weapons
		return list?.find((g) => g.id === item.id) as
			| GridCharacter
			| GridWeapon
			| GridSummon
			| undefined
	})

	const effectiveItem = $derived(liveItem ?? item)

	let roles = $derived(type === 'character' ? ((effectiveItem as GridCharacter).roles ?? []) : [])
	let description = $derived(
		(effectiveItem as GridWeapon).description as Description | null | undefined
	)
	let substitutions = $derived(
		// Spread before sort: Array.prototype.sort mutates in place; mutating
		// inside a $derived trips Svelte 5's state_unsafe_mutation guard.
		[...(((effectiveItem as GridWeapon).substitutions ?? []) as Substitution[])].sort(
			(a, b) => a.position - b.position
		)
	)

	const existingSubstituteItemIds = $derived(
		substitutions
			.map(
				(s) =>
					s.gridCharacter?.character?.id ??
					s.gridWeapon?.weapon?.id ??
					s.gridSummon?.summon?.id ??
					null
			)
			.filter((id): id is string => id !== null)
	)

	function getGridType(t: string): string {
		if (t === 'character') return 'GridCharacter'
		if (t === 'summon') return 'GridSummon'
		return 'GridWeapon'
	}

	const rolesQuery = createQuery(() => ({
		...roleQueries.all(),
		enabled: type === 'character'
	}))

	let selectedRoleIds = $derived(roles.map((r) => r.id))

	// Render chips above the picker using full Role records so we have name/icon
	// even before the catalog query resolves (the grid item itself ships them).
	const selectedRoles = $derived.by((): Role[] =>
		[...roles].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
	)

	const roleOptions = $derived.by(() => {
		const all = (rolesQuery.data ?? []) as Role[]
		const selected = new Set(selectedRoleIds)
		return all.map((r) => ({
			value: r.id,
			label: localizedName({ en: r.nameEn, ja: r.nameJp }) ?? r.nameEn,
			image: getRoleIconUrl(r.iconKey) ?? undefined,
			imageBackground: 'var(--placeholder-bg)',
			// Disable un-selected options once we hit the cap so the user can't
			// add a fourth role; selected options stay enabled so they can be
			// removed.
			disabled: selectedRoleIds.length >= ROLE_CAP && !selected.has(r.id)
		}))
	})

	function removeRole(id: string) {
		handleRolesChange(selectedRoleIds.filter((selectedId) => selectedId !== id))
	}

	const createSubstitution = useCreateSubstitution()
	const updateSubstitution = useUpdateSubstitution()
	const deleteSubstitution = useDeleteSubstitution()
	const updateWeapon = useUpdateGridWeapon()
	const updateCharacter = useUpdateGridCharacter()
	const updateSummon = useUpdateGridSummon()

	function dispatchUpdate(updates: Record<string, unknown>) {
		if (!item.id || !partyShortcode) return
		if (type === 'weapon') {
			updateWeapon.mutate({
				id: String(item.id),
				partyShortcode,
				updates: updates as Partial<GridWeapon>
			})
		} else if (type === 'character') {
			updateCharacter.mutate({
				id: String(item.id),
				partyShortcode,
				updates: updates as Partial<GridCharacter>
			})
		} else {
			updateSummon.mutate({
				id: String(item.id),
				partyShortcode,
				updates: updates as Partial<GridSummon>
			})
		}
	}

	let rolesOpen = $state(false)

	function handleRolesChange(next: string[]) {
		dispatchUpdate({ roleIds: next })
		// Close the picker as soon as we hit the cap — no further selections
		// are possible, and the trigger will disable on the next render.
		if (next.length >= ROLE_CAP) rolesOpen = false
	}

	function handleDescriptionSave(next: Description | null) {
		dispatchUpdate({ description: next })
	}

	function handleAddSubstitute() {
		if (!partyId || !partyShortcode || !item.id) return
		if (substitutions.length >= SUBSTITUTION_CAP) return
		const searchPaneId = `search-substitute-${item.id}`
		if (sidebar.paneStack.panes.some((p) => p.id === searchPaneId)) return
		sidebar.push({
			id: searchPaneId,
			title: m.substitution_add_prompt(),
			component: SearchContent,
			props: {
				type,
				canAddMore: true,
				excludedIds: existingSubstituteItemIds,
				onAddItems: (items: AddItemResult[]) => {
					const addItem = items[0]
					if (!addItem) return
					createSubstitution.mutate(
						{
							partyId: partyId!,
							partyShortcode: partyShortcode!,
							gridType: getGridType(type),
							gridId: String(item.id),
							itemId: addItem.id
						},
						{ onSuccess: () => sidebar.pop() }
					)
				}
			},
			onback: () => sidebar.pop()
		})
	}

	function handleDelete(sub: Substitution) {
		if (!partyId || !partyShortcode) return
		deleteSubstitution.mutate({
			id: sub.id,
			partyId: partyId!,
			partyShortcode: partyShortcode!
		})
	}

	let dragIndex = $state<number | null>(null)
	let hoverIndex = $state<number | null>(null)

	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('text/plain', String(index))
		}
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault()
		hoverIndex = index
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
	}

	function onDragLeave() {
		hoverIndex = null
	}

	async function onDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault()
		const from = dragIndex
		dragIndex = null
		hoverIndex = null
		if (from === null || from === dropIndex) return
		if (!partyId || !partyShortcode) return

		const next = [...substitutions]
		const [moved] = next.splice(from, 1)
		if (!moved) return
		next.splice(dropIndex, 0, moved)

		try {
			for (let i = 0; i < next.length; i++) {
				const target = next[i]
				if (!target) continue
				if (target.position === i) continue
				await updateSubstitution.mutateAsync({
					id: target.id,
					partyId: partyId!,
					partyShortcode: partyShortcode!,
					position: i
				})
			}
		} catch (err) {
			console.error('Failed to reorder substitutions:', err)
		}
	}

	function getSubstituteName(sub: Substitution): string {
		if (sub.gridCharacter) return localizedName(sub.gridCharacter.character?.name) ?? '—'
		if (sub.gridWeapon) return localizedName(sub.gridWeapon.weapon?.name) ?? '—'
		if (sub.gridSummon) return localizedName(sub.gridSummon.summon?.name) ?? '—'
		return '—'
	}

	function getSubstituteImage(sub: Substitution): string {
		if (sub.gridCharacter?.character) {
			const c = sub.gridCharacter.character
			return getCharacterImage(c.granblueId, 'square', c.styleSwap ? STYLE_SWAP_POSE : '01')
		}
		if (sub.gridWeapon?.weapon) {
			const w = sub.gridWeapon.weapon
			return getWeaponImage(w.granblueId, 'square', w.element === 0 ? 0 : undefined)
		}
		if (sub.gridSummon?.summon) {
			return getSummonImage(sub.gridSummon.summon.granblueId, 'square')
		}
		return getPlaceholder(type, 'square')
	}

	function getSubstituteElement(sub: Substitution): number | undefined {
		return (
			sub.gridCharacter?.character?.element ??
			sub.gridWeapon?.weapon?.element ??
			sub.gridSummon?.summon?.element
		)
	}

	function getSubstituteProficiencies(sub: Substitution): number[] {
		const charProfs = sub.gridCharacter?.character?.proficiency
		if (Array.isArray(charProfs)) return charProfs.filter((p): p is number => p !== undefined)
		const weaponProf = sub.gridWeapon?.weapon?.proficiency
		if (typeof weaponProf === 'number') return [weaponProf]
		return []
	}

	function isFromCollection(sub: Substitution): boolean {
		return !!(
			sub.gridCharacter?.collectionCharacterId ||
			sub.gridWeapon?.collectionWeaponId ||
			sub.gridSummon?.collectionSummonId
		)
	}

	function getSubstituteFallbackImage(sub: Substitution): string | undefined {
		if (sub.gridWeapon?.weapon && sub.gridWeapon.weapon.element === 0) {
			return getWeaponFallbackImage(sub.gridWeapon.weapon.granblueId, 'square')
		}
		return undefined
	}
</script>

<div class="notes-edit-section">
	{#if type === 'character'}
		<DetailsSection title={m.notes_roles_section()}>
			{#snippet action()}
				<span class="header-count">{selectedRoleIds.length} / {ROLE_CAP}</span>
			{/snippet}
			<div class="roles-field">
				{#if selectedRoles.length > 0}
					<ul class="role-chips">
						{#each selectedRoles as role (role.id)}
							{@const iconUrl = getRoleIconUrl(role.iconKey)}
							<li class="role-chip">
								<span class="chip-icon">
									{#if iconUrl}
										<img src={iconUrl} alt="" />
									{/if}
								</span>
								<span class="chip-label"
									>{localizedName({ en: role.nameEn, ja: role.nameJp }) ?? role.nameEn}</span
								>
								<button
									type="button"
									class="chip-remove"
									onclick={() => removeRole(role.id)}
									title={m.substitution_remove()}
								>
									<Icon name="close" size={12} />
								</button>
							</li>
						{/each}
					</ul>
				{/if}
				<MultiSelect
					options={roleOptions}
					value={selectedRoleIds}
					onValueChange={handleRolesChange}
					bind:open={rolesOpen}
					placeholder={m.notes_roles_placeholder()}
					displayText={m.notes_roles_placeholder()}
					disabled={selectedRoleIds.length >= ROLE_CAP}
					size="medium"
					contained
					fullWidth
				/>
			</div>
		</DetailsSection>
	{/if}

	<DetailsSection title={m.notes_description_section()}>
		<DescriptionEditor
			value={description ?? null}
			placeholder={m.notes_description_placeholder()}
			onSave={handleDescriptionSave}
		/>
	</DetailsSection>

	<DetailsSection title={m.notes_substitutes_section()}>
		{#snippet action()}
			<span class="header-count">{substitutions.length} / {SUBSTITUTION_CAP}</span>
		{/snippet}
		{#if substitutions.length === 0}
			<div class="substitution-empty">
				<p class="empty">{m.substitution_empty()}</p>
				<Button variant="secondary" leftIcon="plus" onclick={handleAddSubstitute}>
					{m.substitution_add()}
				</Button>
			</div>
		{:else}
			<div class="substitution-stack">
				<ol class="substitution-list">
					{#each substitutions as sub, index (sub.id)}
						{@const character = sub.gridCharacter?.character}
						{@const element = getSubstituteElement(sub)}
						{@const proficiencies = getSubstituteProficiencies(sub)}
						{@const fromCollection = isFromCollection(sub)}
						<li
							class="substitution-item"
							class:drop-target={hoverIndex === index && dragIndex !== null && dragIndex !== index}
							draggable="true"
							ondragstart={(e) => onDragStart(e, index)}
							ondragover={(e) => onDragOver(e, index)}
							ondragleave={onDragLeave}
							ondrop={(e) => onDrop(e, index)}
						>
							<div class="thumb-wrapper">
								<img
									src={getSubstituteImage(sub)}
									alt=""
									class="thumb"
									loading="lazy"
									onerror={(e) => handleImageFallback(e, getSubstituteFallbackImage(sub))}
								/>
								{#if fromCollection}
									<CollectionBadge />
								{/if}
							</div>
							<div class="info">
								<span class="name">{getSubstituteName(sub)}</span>
								{#if element !== undefined || proficiencies.length > 0}
									<div class="labels">
										{#if element !== undefined}
											<ElementLabel {element} size="small" />
										{/if}
										{#each proficiencies as prof (prof)}
											<ProficiencyLabel proficiency={prof} size="small" />
										{/each}
									</div>
								{/if}
							</div>
							{#if character}
								<CharacterTags {character} />
							{/if}
							<button
								class="action-btn delete"
								onclick={() => handleDelete(sub)}
								title={m.substitution_remove()}
							>
								<Icon name="close" size={14} />
							</button>
						</li>
					{/each}
				</ol>
				<Button
					variant="ghost"
					fullWidth
					leftIcon="plus"
					onclick={handleAddSubstitute}
					disabled={substitutions.length >= SUBSTITUTION_CAP}
				>
					{m.substitution_add()}
				</Button>
			</div>
		{/if}
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.notes-edit-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x + spacing.$unit-half;
	}

	.header-count {
		font-size: typography.$font-small;
		font-weight: typography.$normal;
		color: var(--text-secondary);
	}

	.roles-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.role-chips {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.role-chip {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half spacing.$unit spacing.$unit-half spacing.$unit-half;
		background: var(--input-bound-bg);
		border-radius: 999px;
		font-size: typography.$font-small;
		color: var(--text-primary);

		.chip-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			flex-shrink: 0;
			background: var(--placeholder-bg);
			border-radius: 50%;
			overflow: hidden;

			img {
				width: 16px;
				height: 16px;
				object-fit: contain;
			}
		}

		.chip-label {
			line-height: 1;
		}

		.chip-remove {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			padding: 0;
			border: none;
			background: transparent;
			color: var(--text-tertiary);
			cursor: pointer;
			border-radius: 50%;
			margin-left: spacing.$unit-half;
			transition:
				color 0.15s ease,
				background 0.15s ease;

			&:hover {
				color: var(--text-primary);
				background: var(--input-bound-bg-hover);
			}
		}
	}

	.substitution-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		min-height: 10rem;
		padding: spacing.$unit-2x spacing.$unit;
	}

	.empty {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 0;
		text-align: center;
	}

	.substitution-stack {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.substitution-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.substitution-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		font-size: typography.$font-regular;
		padding: spacing.$unit;
		border-radius: spacing.$unit;
		cursor: grab;
		transition:
			background 0.15s ease,
			outline-color 0.15s ease;
		outline: 2px solid transparent;

		&:hover {
			background: var(--list-cell-bg-hover);
		}

		&:active {
			cursor: grabbing;
		}

		&.drop-target {
			outline-color: var(--accent-blue);
		}
	}

	.thumb-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.thumb {
		display: block;
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-primary);
		background: var(--placeholder-bg);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
		font-size: typography.$font-regular;
	}

	.labels {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: layout.$item-corner-small;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background 0.15s ease;

		&:hover:not(:disabled) {
			color: var(--text-primary);
			background: var(--input-bound-bg-hover);
		}

		&.delete:hover:not(:disabled) {
			color: var(--red);
		}
	}
</style>
