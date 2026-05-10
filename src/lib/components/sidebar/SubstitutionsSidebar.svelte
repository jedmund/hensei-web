<script lang="ts">
	import type {
		GridCharacter,
		GridWeapon,
		GridSummon,
		Role,
		Substitution
	} from '$lib/types/api/party'
	import { createQuery } from '@tanstack/svelte-query'
	import { roleQueries } from '$lib/api/queries/role.queries'
	import {
		useCreateSubstitution,
		useUpdateSubstitution,
		useDeleteSubstitution
	} from '$lib/api/mutations/substitution.mutations'
	import { useUpdateGridWeapon } from '$lib/api/mutations/grid.mutations'
	import { useUpdateGridCharacter } from '$lib/api/mutations/grid.mutations'
	import { useUpdateGridSummon } from '$lib/api/mutations/grid.mutations'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import SearchContent from '$lib/components/sidebar/SearchContent.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import { localizedName } from '$lib/utils/locale'
	import Select from '$lib/components/ui/Select.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { AddItemResult } from '$lib/types/api/search'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		editable?: boolean
		partyId?: string
		partyShortcode?: string
	}

	let { type, item, editable = false, partyId, partyShortcode }: Props = $props()

	// Derive data from item
	let role = $derived((item as GridWeapon).role as Role | undefined)
	let note = $derived((item as GridWeapon).substitutionNote as string | undefined)
	let substitutions = $derived(
		// Spread before sort: Array.prototype.sort mutates in place, and a $derived
		// expression must not mutate state — Svelte 5 throws state_unsafe_mutation
		// and downstream reactivity breaks (added substitutes don't appear).
		[...(((item as GridWeapon).substitutions ?? []) as Substitution[])].sort(
			(a, b) => a.position - b.position
		)
	)

	// Slot type mapping for roles query
	function getSlotType(t: string): string {
		if (t === 'character') return 'Character'
		if (t === 'summon') return 'Summon'
		return 'Weapon'
	}

	// Grid type mapping for API
	function getGridType(t: string): string {
		if (t === 'character') return 'GridCharacter'
		if (t === 'summon') return 'GridSummon'
		return 'GridWeapon'
	}

	// Roles query
	const rolesQuery = createQuery(() => ({
		...roleQueries.bySlotType(getSlotType(type)),
		enabled: editable
	}))

	const roleOptions = $derived.by(() => {
		const roles = (rolesQuery.data ?? []) as Role[]
		const options: { value: string; label: string }[] = [
			{ value: '', label: m.substitution_role_none() }
		]
		for (const r of roles) {
			options.push({
				value: r.id,
				label: localizedName({ en: r.nameEn, ja: r.nameJp }) ?? r.nameEn
			})
		}
		return options
	})

	// Local state for editable fields (writable derived syncs from item)
	let selectedRoleId = $derived(role?.id ?? '')
	let noteText = $derived(note ?? '')

	// Mutations
	const createSubstitution = useCreateSubstitution()
	const updateSubstitution = useUpdateSubstitution()
	const deleteSubstitution = useDeleteSubstitution()
	const updateWeapon = useUpdateGridWeapon()
	const updateCharacter = useUpdateGridCharacter()
	const updateSummon = useUpdateGridSummon()

	// Save role change
	function handleRoleChange(value: string | undefined) {
		if (!item.id || !partyShortcode) return
		const roleId = value || null
		const updates = { roleId } as Record<string, unknown>

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

	// Save note on blur
	function handleNoteBlur() {
		if (!item.id || !partyShortcode) return
		if (noteText === (note ?? '')) return
		const updates = { substitutionNote: noteText || null } as Record<string, unknown>

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

	// Add substitute via search
	function handleAddSubstitute() {
		if (!partyId || !partyShortcode || !item.id) return

		const searchPaneId = `search-substitute-${item.id}`
		if (sidebar.paneStack.panes.some((p) => p.id === searchPaneId)) return

		sidebar.push({
			id: searchPaneId,
			title: m.substitution_add_prompt(),
			component: SearchContent,
			props: {
				type,
				canAddMore: true,
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
						{
							onSuccess: () => sidebar.pop()
						}
					)
				}
			},
			onback: () => sidebar.pop()
		})
	}

	// Delete substitute
	function handleDelete(sub: Substitution) {
		if (!partyId || !partyShortcode) return
		deleteSubstitution.mutate({
			id: sub.id,
			partyId: partyId!,
			partyShortcode: partyShortcode!
		})
	}

	// Move substitute up/down. Run the two position updates sequentially so the
	// query cache only invalidates once the swap has fully settled — running
	// them in parallel races the cache and can also trip a server-side unique
	// constraint on (grid_type, grid_id, position). A dedicated server-side
	// swap endpoint would be the cleaner long-term fix.
	async function handleMove(sub: Substitution, direction: 'up' | 'down') {
		if (!partyId || !partyShortcode) return
		const currentIndex = substitutions.findIndex((s) => s.id === sub.id)
		const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
		if (targetIndex < 0 || targetIndex >= substitutions.length) return

		const target = substitutions[targetIndex]
		if (!target) return

		try {
			await updateSubstitution.mutateAsync({
				id: sub.id,
				partyId: partyId!,
				partyShortcode: partyShortcode!,
				position: target.position
			})
			await updateSubstitution.mutateAsync({
				id: target.id,
				partyId: partyId!,
				partyShortcode: partyShortcode!,
				position: sub.position
			})
		} catch (err) {
			console.error('Failed to swap substitution positions:', err)
		}
	}

	function getSubstituteName(sub: Substitution): string {
		if (sub.gridCharacter) return localizedName(sub.gridCharacter.character?.name) ?? '\u2014'
		if (sub.gridWeapon) return localizedName(sub.gridWeapon.weapon?.name) ?? '\u2014'
		if (sub.gridSummon) return localizedName(sub.gridSummon.summon?.name) ?? '\u2014'
		return '\u2014'
	}
</script>

<div class="substitutions-sidebar">
	<DetailsSection title={m.substitution_role()}>
		{#if editable}
			<Select
				options={roleOptions}
				bind:value={selectedRoleId}
				onValueChange={handleRoleChange}
				placeholder={m.substitution_role_none()}
				contained
				fullWidth
			/>
		{:else if role}
			<p class="role-name">
				{localizedName({ en: role.nameEn, ja: role.nameJp })}
			</p>
		{:else}
			<p class="empty">{m.substitution_role_none()}</p>
		{/if}
	</DetailsSection>

	<DetailsSection title={m.substitution_note()}>
		{#if editable}
			<textarea
				class="note-input contained"
				bind:value={noteText}
				onblur={handleNoteBlur}
				placeholder={m.substitution_note_placeholder()}
				rows="3"
			></textarea>
		{:else if note}
			<p class="note">{note}</p>
		{:else}
			<p class="empty">{m.substitution_note_placeholder()}</p>
		{/if}
	</DetailsSection>

	<DetailsSection title={m.substitution_substitutes()}>
		{#if substitutions.length === 0}
			<p class="empty">{m.substitution_empty()}</p>
		{:else}
			<ol class="substitution-list">
				{#each substitutions as sub, index (sub.id)}
					<li class="substitution-item">
						<span class="position">{index + 1}.</span>
						<span class="name">{getSubstituteName(sub)}</span>
						{#if editable}
							<div class="actions">
								<button
									class="action-btn"
									onclick={() => handleMove(sub, 'up')}
									disabled={index === 0}
									title={m.substitution_move_up()}
								>
									<Icon name="chevron-up" size={14} />
								</button>
								<button
									class="action-btn"
									onclick={() => handleMove(sub, 'down')}
									disabled={index === substitutions.length - 1}
									title={m.substitution_move_down()}
								>
									<Icon name="chevron-down" size={14} />
								</button>
								<button
									class="action-btn delete"
									onclick={() => handleDelete(sub)}
									title={m.substitution_remove()}
								>
									<Icon name="x" size={14} />
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if editable && substitutions.length < 10}
			<Button variant="ghost" size="small" fullWidth leftIcon="plus" onclick={handleAddSubstitute}>
				{m.substitution_add()}
			</Button>
		{/if}
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.substitutions-sidebar {
		padding: spacing.$unit-2x;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x + spacing.$unit-half;
	}

	.role-name {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		margin: 0;
	}

	.note {
		font-size: typography.$font-small;
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
	}

	.note-input {
		width: 100%;
		font-family: inherit;
		font-size: typography.$font-small;
		line-height: 1.5;
		padding: spacing.$unit;
		border: 2px solid transparent;
		border-radius: spacing.$unit;
		background: transparent;
		color: var(--text-primary);
		resize: vertical;
		min-height: 60px;
		box-sizing: border-box;

		&::placeholder {
			color: var(--text-tertiary);
		}

		&:focus {
			outline: none;
			border-color: var(--border-focus, var(--accent));
		}

		&.contained {
			background-color: var(--input-bound-bg);

			&:hover:not(:disabled) {
				background-color: var(--input-bound-bg-hover);
			}
		}
	}

	.empty {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 0;
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
		padding: spacing.$unit-half spacing.$unit;
		border-radius: spacing.$unit;
		transition: background 0.15s ease;

		&:hover {
			background: var(--hover-bg, rgba(0, 0, 0, 0.03));
		}
	}

	.position {
		color: var(--text-secondary);
		min-width: 20px;
		font-size: typography.$font-small;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: spacing.$unit-half;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background 0.15s ease;

		&:hover:not(:disabled) {
			color: var(--text-primary);
			background: var(--hover-bg, rgba(0, 0, 0, 0.06));
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}

		&.delete:hover:not(:disabled) {
			color: var(--destructive, #e53e3e);
		}
	}
</style>
