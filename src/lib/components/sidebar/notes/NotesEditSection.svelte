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
		Substitution,
		Description
	} from '$lib/types/api/party'
	import { createQuery } from '@tanstack/svelte-query'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import {
		useUpdateGridWeapon,
		useUpdateGridCharacter,
		useUpdateGridSummon
	} from '$lib/api/mutations/grid.mutations'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DescriptionEditor from './DescriptionEditor.svelte'
	import RolesField from './RolesField.svelte'
	import SubstitutionsField from './SubstitutionsField.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import * as m from '$lib/paraglide/messages'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getElementKey } from '$lib/utils/element'
	import type { GridItemType } from './substitutionHelpers'

	interface Props {
		type: GridItemType
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

	const roles = $derived(type === 'character' ? ((effectiveItem as GridCharacter).roles ?? []) : [])
	const description = $derived(
		(effectiveItem as GridWeapon).description as Description | null | undefined
	)
	const substitutions = $derived(
		// Spread before sort: Array.prototype.sort mutates in place; mutating
		// inside a $derived trips Svelte 5's state_unsafe_mutation guard.
		[...(((effectiveItem as GridWeapon).substitutions ?? []) as Substitution[])].sort(
			(a, b) => a.position - b.position
		)
	)

	const updateWeapon = useUpdateGridWeapon()
	const updateCharacter = useUpdateGridCharacter()
	const updateSummon = useUpdateGridSummon()

	function dispatchUpdate(updates: Record<string, unknown>) {
		if (!item.id || !partyShortcode) return
		if (type === 'weapon') {
			updateWeapon.mutate(
				{ id: String(item.id), partyShortcode, updates: updates as Partial<GridWeapon> },
				{
					onError: (err) => toast.error(extractErrorMessage(err, m.toast_failed_update_weapon()))
				}
			)
		} else if (type === 'character') {
			updateCharacter.mutate(
				{ id: String(item.id), partyShortcode, updates: updates as Partial<GridCharacter> },
				{
					onError: (err) => toast.error(extractErrorMessage(err, m.toast_failed_update_character()))
				}
			)
		} else {
			updateSummon.mutate(
				{ id: String(item.id), partyShortcode, updates: updates as Partial<GridSummon> },
				{
					onError: (err) => toast.error(extractErrorMessage(err, m.toast_failed_update_summon()))
				}
			)
		}
	}

	function handleRolesChange(next: string[]) {
		dispatchUpdate({ roleIds: next })
	}

	function handleDescriptionSave(next: Description | null) {
		dispatchUpdate({ description: next })
	}

	// Notes sync switch is only meaningful when another grid slot already holds
	// the same canonical weapon/summon. Computed against the live party so the
	// switch appears/disappears as duplicates come and go without a remount.
	const siblings = $derived.by(() => {
		if (type === 'weapon') {
			const gid = (effectiveItem as GridWeapon).weapon?.granblueId
			if (!gid) return []
			return partyStore.getWeaponSiblings(gid, String(item.id ?? ''))
		}
		if (type === 'summon') {
			const gid = (effectiveItem as GridSummon).summon?.granblueId
			if (!gid) return []
			return partyStore.getSummonSiblings(gid, String(item.id ?? ''))
		}
		return []
	})

	const showSyncSwitch = $derived((type === 'weapon' || type === 'summon') && siblings.length >= 1)

	const notesSynced = $derived((effectiveItem as GridWeapon | GridSummon).notesSynced ?? false)

	const syncItemName = $derived.by(() => {
		if (type === 'weapon') return localizedName((effectiveItem as GridWeapon).weapon?.name)
		if (type === 'summon') return localizedName((effectiveItem as GridSummon).summon?.name)
		return ''
	})

	const syncElement = $derived.by(() => {
		const allowed = ['wind', 'fire', 'water', 'earth', 'dark', 'light'] as const
		let raw: number | undefined
		if (type === 'weapon') {
			const w = effectiveItem as GridWeapon
			raw = w.element || w.weapon?.element
		} else if (type === 'summon') {
			raw = (effectiveItem as GridSummon).summon?.element
		}
		const key = raw ? getElementKey(raw) : 'null'
		return (allowed as readonly string[]).includes(key)
			? (key as (typeof allowed)[number])
			: undefined
	})

	function handleSyncToggle(next: boolean) {
		// Skip the no-op write the bind:checked $effect fires on mount.
		if (next === notesSynced) return
		dispatchUpdate({ notesSynced: next })
	}
</script>

<div class="notes-edit-section">
	{#if type === 'character'}
		<DetailsSection title={m.notes_roles_section()}>
			{#snippet action()}
				<span class="header-count">{roles.length} / {ROLE_CAP}</span>
			{/snippet}
			<RolesField {roles} cap={ROLE_CAP} onChange={handleRolesChange} />
		</DetailsSection>
	{/if}

	{#if showSyncSwitch}
		<div class="sync-row">
			<span class="sync-label"
				>{m.notes_sync_label_prefix()}<b>{syncItemName}</b>{m.notes_sync_label_suffix()}</span
			>
			<Switch
				checked={notesSynced}
				element={syncElement}
				onCheckedChange={handleSyncToggle}
				size="small"
			/>
		</div>
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
		<SubstitutionsField
			{substitutions}
			{type}
			gridItemId={item.id}
			{partyId}
			{partyShortcode}
			cap={SUBSTITUTION_CAP}
		/>
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.notes-edit-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		// Match the sync row's horizontal padding inside this scope so the
		// description / substitutes section frames align with the switch.
		:global(.details-section) {
			padding-left: spacing.$unit-2x;
			padding-right: spacing.$unit-2x;
		}
	}

	.sync-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-half spacing.$unit-2x;
	}

	.sync-label {
		font-size: typography.$font-small;
		color: var(--text-primary);
	}

	.header-count {
		font-size: typography.$font-small;
		font-weight: typography.$normal;
		color: var(--text-secondary);
	}
</style>
