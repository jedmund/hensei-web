<script lang="ts">
	import { usePartyContext } from '$lib/types/party-context'
	import type { PartyCollection } from '$lib/types/api/party'
	import type { Guidebook } from '$lib/types/api/entities'
	import { GridType } from '$lib/types/enums'
	import type { JobHandlers } from '$lib/composables/job-handlers.svelte'
	import {
		useUpdatePartyGuidebook,
		useRemovePartyGuidebook
	} from '$lib/api/mutations/guidebook.mutations'
	import { openGuidebookSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import { openCalculatorPane } from '$lib/features/party/openCalculatorPane'
	import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
	import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
	import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
	import JobSection from '$lib/components/job/JobSection.svelte'
	import { Gender } from '$lib/utils/jobUtils'
	import Button from '$lib/components/ui/Button.svelte'
	import DismissibleNotice from '$lib/components/ui/DismissibleNotice.svelte'
	import * as m from '$lib/paraglide/messages'

	/** The active tab's grid, with the notices and job section that go with it. */
	interface Props {
		activeTab: GridType
		/** The collection whose uncap levels the grids compare against */
		activeCollection: PartyCollection | undefined
		isSolomonis: boolean
		jobHandlers: JobHandlers
		onOpenSettings: () => void
	}

	let { activeTab, activeCollection, isSolomonis, jobHandlers, onOpenSettings }: Props = $props()

	const ctx = usePartyContext()
	const party = $derived(ctx.getParty())

	// --- Guidebook mutations ---
	const updateGuidebook = useUpdatePartyGuidebook()
	const removeGuidebook = useRemovePartyGuidebook()

	function handleClickGuidebookSlot(position: number) {
		if (!ctx.canEdit()) return
		openGuidebookSearchSidebar({
			position,
			onSelect: (result) => {
				const guidebook: Guidebook = {
					id: result.id,
					granblueId: Number(result.granblueId),
					name: result.name as { en: string; ja: string },
					slug: ''
				}
				updateGuidebook.mutate({
					partyId: party.id,
					shortcode: party.shortcode,
					guidebookId: result.id,
					guidebook,
					position: position as 1 | 2 | 3
				})
			}
		})
	}

	function handleRemoveGuidebook(position: number) {
		if (!ctx.canEdit()) return
		removeGuidebook.mutate({
			partyId: party.id,
			shortcode: party.shortcode,
			position: position as 1 | 2 | 3
		})
	}

	// --- Derived values ---
	const mainWeapon = $derived((party?.weapons ?? []).find((w) => w?.mainhand || w?.position === -1))
	const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
	const partyElement = $derived(party?.element)
	// Convert user gender (1=Male, 2=Female) to image gender suffix (0=Gran, 1=Djeeta)
	const characterGender = $derived(party.user?.gender === 2 ? 1 : 0)

	// Collection item maps from embedded data (granblueId → items with levels)
	type CollectionEntry = { uncapLevel: number; transcendenceStep: number }
	type CollectionLevels = { uncapLevel?: number | null; transcendenceStep?: number | null }

	function levelsByGranblueId<T extends CollectionLevels>(
		items: T[],
		granblueId: (item: T) => string | number
	) {
		return items.reduce((map, item) => {
			const gid = String(granblueId(item))
			const arr = map.get(gid) ?? []
			arr.push({ uncapLevel: item.uncapLevel ?? 0, transcendenceStep: item.transcendenceStep ?? 0 })
			map.set(gid, arr)
			return map
		}, new Map<string, CollectionEntry[]>())
	}

	const collectionWeaponItems = $derived(
		activeCollection
			? levelsByGranblueId(activeCollection.weapons, (w) => w.weapon.granblueId)
			: undefined
	)
	const collectionCharacterItems = $derived(
		activeCollection
			? levelsByGranblueId(activeCollection.characters, (c) => c.character.granblueId)
			: undefined
	)
	const collectionSummonItems = $derived(
		activeCollection
			? levelsByGranblueId(activeCollection.summons, (s) => s.summon.granblueId)
			: undefined
	)
</script>

<div class="party-content">
	<svelte:boundary
		onerror={(e) => {
			if (import.meta.env.DEV) console.error('Grid render error:', e)
		}}
	>
		{#if activeTab === GridType.Weapon}
			<div class="tab-content">
				{#if party.shortcode}
					<DismissibleNotice
						id="weapon-calculator"
						variant="yellow"
						badge={m.notice_new()}
						class="calculator-notice"
					>
						{m.weapon_calculator_notice()}
						{#snippet action()}
							<Button variant="ghost" size="small" onclick={() => openCalculatorPane(party)}>
								{m.calculator_open_short()}
							</Button>
						{/snippet}
					</DismissibleNotice>
				{/if}
				<WeaponGrid
					weapons={party.weapons}
					raidExtra={party.raid?.extra}
					showGuidebooks={party.raid?.group?.guidebooks && !isSolomonis}
					guidebooks={party.guidebooks}
					canEdit={ctx.canEdit()}
					onClickGuidebookSlot={handleClickGuidebookSlot}
					onRemoveGuidebook={handleRemoveGuidebook}
					{collectionWeaponItems}
				/>
			</div>
		{:else if activeTab === GridType.Summon}
			<SummonGrid summons={party.summons} {collectionSummonItems} />
		{:else}
			<div class="tab-content">
				{#if ctx.canEdit() && !party.fullAuto}
					<DismissibleNotice id="full-auto-skills" variant="yellow" badge={m.notice_new()}>
						{m.full_auto_skills_notice()}
						{#snippet action()}
							<Button variant="ghost" size="small" onclick={onOpenSettings}>
								{m.full_auto_skills_notice_action()}
							</Button>
						{/snippet}
					</DismissibleNotice>
				{/if}
				<JobSection
					job={party.job}
					jobSkills={party.jobSkills}
					fullAutoSkills={party.fullAutoSkills}
					fullAuto={party.fullAuto}
					accessory={party.accessory}
					canEdit={ctx.canEdit()}
					gender={party.user?.gender ?? Gender.Gran}
					element={mainWeaponElement}
					onSelectJob={jobHandlers.handleSelectJob}
					onSelectSkill={jobHandlers.handleSelectJobSkill}
					onRemoveSkill={jobHandlers.handleRemoveJobSkill}
					onToggleSkillFa={jobHandlers.handleToggleJobSkillFa}
					onSelectAccessory={jobHandlers.handleSelectAccessory}
				/>
				<CharacterGrid
					characters={party.characters}
					{mainWeaponElement}
					{partyElement}
					gender={characterGender}
					unlimited={party?.raid?.group?.unlimited}
					{collectionCharacterItems}
				/>
			</div>
		{/if}
		<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
		{#snippet failed(error, reset)}
			<div class="grid-error" role="alert">
				<p>{m.party_grid_error()}</p>
				<button onclick={reset}>{m.retry()}</button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.party-content {
		min-height: 400px;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		:global(.calculator-notice) {
			margin-bottom: $unit;
		}
	}
</style>
