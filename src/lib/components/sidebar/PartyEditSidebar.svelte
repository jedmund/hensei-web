<script lang="ts">
	/**
	 * PartyEditSidebar - Edit party metadata (settings, performance, video)
	 *
	 * This sidebar is opened via openPartyEditSidebar() and provides
	 * editing for battle settings, clear time, metrics, video URL, and raid.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from './details/DetailsSection.svelte'
	import DetailRow from './details/DetailRow.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import BattleSettingsSection from '$lib/components/party/edit/BattleSettingsSection.svelte'
	import ClearTimeInput from '$lib/components/party/edit/ClearTimeInput.svelte'
	import YouTubeUrlInput from '$lib/components/party/edit/YouTubeUrlInput.svelte'
	import MetricField from '$lib/components/party/edit/MetricField.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import EditDescriptionPane from '$lib/components/sidebar/EditDescriptionPane.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { untrack } from 'svelte'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidFull } from '$lib/types/api/raid'
	import type { PartyVisibility } from '$lib/types/visibility'
	import Icon from '$lib/components/Icon.svelte'
	import { localizedName } from '$lib/utils/locale'

	export interface PartyEditValues {
		name: string
		description: string | null
		visibility: PartyVisibility
		sharedWithCrew: boolean
		fullAuto: boolean
		autoGuard: boolean
		autoSummon: boolean
		chargeAttack: boolean
		clearTime: number | null
		buttonCount: number | null
		chainCount: number | null
		summonCount: number | null
		videoUrl: string | null
		raid: Raid | null
		raidId: string | null
	}

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		/** Pane ID injected by PaneStack for targeted action updates */
		paneId?: string
		/** Current party values */
		initialValues: PartyEditValues
		/** Party element for switch theming */
		element?: ElementType
		/** Callback when save is requested */
		onSave?: (values: PartyEditValues) => void
	}

	let { paneId, initialValues, element, onSave }: Props = $props()

	// Get the pane stack for pushing EditRaidPane
	const paneStack = usePaneStack()

	// Query user's crew membership to show/hide share toggle
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		staleTime: 5 * 60 * 1000 // Cache for 5 minutes
	}))
	const isInCrew = $derived(myCrewQuery.data != null)

	// Snapshot initial values at mount time to avoid proxy/reactivity issues.
	// Props passed through PaneStack's $state are wrapped in deep reactive proxies.
	// Reading initialValues.xxx in $derived creates tracking dependencies on the proxy,
	// which can be invalidated when setAction mutates the pane object.
	// $state.snapshot() produces a plain non-reactive copy, breaking that chain.
	const initial = $state.snapshot(initialValues) as PartyEditValues

	// Local state - initialized from snapshot
	let name = $state(initial.name)
	let visibility = $state<PartyVisibility>(initial.visibility)
	let sharedWithCrew = $state(initial.sharedWithCrew)
	let fullAuto = $state(initial.fullAuto)
	let autoGuard = $state(initial.autoGuard)
	let autoSummon = $state(initial.autoSummon)
	let chargeAttack = $state(initial.chargeAttack)
	let clearTime = $state(initial.clearTime)
	let buttonCount = $state(initial.buttonCount)
	let chainCount = $state(initial.chainCount)
	let summonCount = $state(initial.summonCount)
	let videoUrl = $state(initial.videoUrl)
	let raid = $state<Raid | null>(initial.raid)
	let raidId = $state<string | null>(initial.raidId)
	let description = $state(initial.description)

	// Visibility options for select (1=Public, 2=Unlisted, 3=Private per Rails API)
	const visibilityOptions: Array<{ value: PartyVisibility; label: string }> = [
		{ value: 1, label: 'Public' },
		{ value: 2, label: 'Unlisted' },
		{ value: 3, label: 'Private' }
	]

	// Check if any values have changed (compared against snapshot, not proxy)
	const hasChanges = $derived(
		name !== initial.name ||
			visibility !== initial.visibility ||
			sharedWithCrew !== initial.sharedWithCrew ||
			fullAuto !== initial.fullAuto ||
			autoGuard !== initial.autoGuard ||
			autoSummon !== initial.autoSummon ||
			chargeAttack !== initial.chargeAttack ||
			clearTime !== initial.clearTime ||
			buttonCount !== initial.buttonCount ||
			chainCount !== initial.chainCount ||
			summonCount !== initial.summonCount ||
			videoUrl !== initial.videoUrl ||
			raidId !== initial.raidId ||
			description !== initial.description
	)

	// Expose save function for sidebar action button
	export function save() {
		const values: PartyEditValues = {
			name,
			description,
			visibility,
			sharedWithCrew,
			fullAuto,
			autoGuard,
			autoSummon,
			chargeAttack,
			clearTime,
			buttonCount,
			chainCount,
			summonCount,
			videoUrl,
			raid,
			raidId
		}
		onSave?.(values)
		sidebar.close()
	}

	// Update sidebar action button state based on changes.
	// Uses setActionForPane to target this pane by ID, so the action is set
	// correctly even when another pane (e.g. EditRaidPane) is on top.
	// IMPORTANT: paneId must be read inside untrack() to avoid an infinite loop —
	// updatePaneAt creates a new panes array, which re-spreads component props,
	// which would re-trigger this effect if paneId were tracked.
	$effect(() => {
		const changed = hasChanges
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(
					paneId,
					changed ? save : undefined,
					m.action_save(),
					element
				)
			} else {
				if (changed) {
					sidebar.setAction(save, m.action_save(), element)
				} else {
					sidebar.setAction(undefined, m.action_save(), element)
				}
			}
		})
	})

	function handleSettingsChange(
		field: 'fullAuto' | 'autoGuard' | 'autoSummon' | 'chargeAttack',
		value: boolean
	) {
		if (field === 'fullAuto') fullAuto = value
		else if (field === 'autoGuard') autoGuard = value
		else if (field === 'autoSummon') autoSummon = value
		else chargeAttack = value
	}

	function getRaidName(r: Raid | null): string {
		if (!r) return ''
		return localizedName(r.name)
	}

	function openRaidPane() {
		paneStack.push({
			id: 'edit-raid',
			title: 'Select Raid',
			component: EditRaidPane,
			props: {
				currentRaid: raid,
				onSelect: handleRaidSelected
			},
			scrollable: true
		})
	}

	function getRaidElementClass(r: Raid | null): string {
		if (!r) return ''
		const elementMap: Record<number, string> = {
			1: 'wind',
			2: 'fire',
			3: 'water',
			4: 'earth',
			5: 'dark',
			6: 'light'
		}
		return elementMap[r.element] ?? ''
	}

	function handleRaidSelected(selectedRaid: RaidFull | null) {
		if (selectedRaid) {
			// Convert RaidFull to Raid (they have compatible structures)
			raid = {
				id: selectedRaid.id,
				slug: selectedRaid.slug,
				name: selectedRaid.name,
				level: selectedRaid.level,
				element: selectedRaid.element,
				group: selectedRaid.group
					? {
							id: selectedRaid.group.id,
							name: selectedRaid.group.name,
							section: String(selectedRaid.group.section),
							order: selectedRaid.group.order,
							difficulty: selectedRaid.group.difficulty,
							hl: selectedRaid.group.hl,
							extra: selectedRaid.group.extra,
							guidebooks: selectedRaid.group.guidebooks,
							unlimited: selectedRaid.group.unlimited
						}
					: undefined
			}
			raidId = selectedRaid.id
		} else {
			raid = null
			raidId = null
		}
		paneStack.pop()
	}

	interface JSONContent {
		type?: string
		text?: string
		content?: JSONContent[]
		attrs?: Record<string, unknown>
	}

	/** Extract first non-empty paragraph from TipTap JSON content */
	function getDescriptionPreview(desc: string | null): string | null {
		if (!desc) return null
		try {
			const parsed = JSON.parse(desc) as JSONContent
			if (parsed.type !== 'doc' || !parsed.content?.length) return null

			// Extract text from an inline node (text or mention)
			const getNodeText = (node: JSONContent): string => {
				if (node.type === 'text') return node.text ?? ''
				if (node.type === 'mention') {
					const id = node.attrs?.id as { name?: { en?: string }; granblue_en?: string } | undefined
					return id?.name?.en ?? id?.granblue_en ?? ''
				}
				return ''
			}

			// Extract text from a block
			const getBlockText = (block: JSONContent): string =>
				block.content?.map(getNodeText).join('') ?? ''

			// Find first non-empty paragraph or heading
			for (const node of parsed.content) {
				if (node.type !== 'paragraph' && node.type !== 'heading') continue
				const text = getBlockText(node).trim()
				if (text) return text
			}

			return null
		} catch {
			// Legacy plain text - return first non-empty line
			return desc.split('\n').map((l) => l.trim()).find(Boolean) ?? null
		}
	}

	const descriptionPreview = $derived(getDescriptionPreview(description))

	function openDescriptionPane() {
		paneStack.push({
			id: 'edit-description',
			title: 'Edit Description',
			component: EditDescriptionPane,
			props: {
				description,
				onSave: (content: string) => {
					description = content
					paneStack.pop()
				}
			},
			scrollable: false
		})
	}
</script>

<div class="party-edit-sidebar">
	<div class="top-section">
		<h3>Details</h3>
		<div class="top-fields">
			<Input
				label="Title"
				bind:value={name}
				placeholder={m.sidebar_party_title_placeholder()}
				contained
				fullWidth
			/>
			<YouTubeUrlInput label="Video" bind:value={videoUrl} contained />
			<div class="raid-field">
				<span class="raid-label">Raid</span>
				<button
					type="button"
					class="raid-select-button {getRaidElementClass(raid)}"
					onclick={openRaidPane}
				>
					{#if raid}
						<span class="raid-name">{getRaidName(raid)}</span>
					{:else}
						<span class="placeholder">Select raid...</span>
					{/if}
					<Icon name="chevron-right" size={16} class="chevron-icon" />
				</button>
			</div>
		</div>
	</div>

	<hr class="divider" />

	<button type="button" class="description-button" onclick={openDescriptionPane}>
		<div class="description-header">
			<span class="description-label">Description</span>
			<Icon name="chevron-right" size={16} class="description-chevron" />
		</div>
		{#if descriptionPreview}
			<p class="description-preview">{descriptionPreview}</p>
		{:else}
			<span class="description-placeholder">{m.sidebar_add_description()}</span>
		{/if}
	</button>

	<hr class="divider" />

	<DetailsSection title="Sharing">
		<DetailRow label="Visibility" noHover compact>
			{#snippet children()}
				<Select
					options={visibilityOptions}
					bind:value={visibility}
					contained
				/>
			{/snippet}
		</DetailRow>
		{#if isInCrew}
			<DetailRow label="Share with Crew" noHover compact>
				{#snippet children()}
					<Switch
						bind:checked={sharedWithCrew}
						size="small"
						{element}
					/>
				{/snippet}
			</DetailRow>
		{/if}
	</DetailsSection>

	<hr class="divider" />

	<BattleSettingsSection
		bind:fullAuto
		bind:autoGuard
		bind:autoSummon
		bind:chargeAttack
		{element}
		onchange={handleSettingsChange}
	/>

	<hr class="divider" />

	<DetailsSection title="Performance">
		<DetailRow label="Clear Time" noHover compact>
			{#snippet children()}
				<ClearTimeInput bind:value={clearTime} contained />
			{/snippet}
		</DetailRow>
		<DetailRow label="Button Count" noHover compact>
			{#snippet children()}
				<MetricField bind:value={buttonCount} label="B" contained />
			{/snippet}
		</DetailRow>
		<DetailRow label="Chain Count" noHover compact>
			{#snippet children()}
				<MetricField bind:value={chainCount} label="C" contained />
			{/snippet}
		</DetailRow>
		<DetailRow label="Summon Count" noHover compact>
			{#snippet children()}
				<MetricField bind:value={summonCount} label="S" contained />
			{/snippet}
		</DetailRow>
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.party-edit-sidebar {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-bottom: $unit-2x;
	}

	.top-section {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit;

		h3 {
			margin: 0;
			font-size: $font-name;
			font-weight: $medium;
			color: var(--text-primary);
			padding: 0 $unit;
		}
	}

	.top-fields {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit;

		// Override Input label styling to match DetailRow
		:global(.label) {
			color: var(--text-secondary) !important;
			font-size: $font-regular !important;
			font-weight: normal !important;
		}
	}

	.divider {
		border: none;
		border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
		margin: 0;
	}

	.raid-field {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.raid-label {
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.raid-select-button {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.raid-name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.placeholder {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.chevron-icon {
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.description-button {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		margin: 0 $unit-2x;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.description-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.description-label {
		font-size: $font-name;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.description-preview {
		margin: 0;
		overflow: hidden;
		font-size: $font-regular;
		color: var(--text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.description-placeholder {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.description-chevron {
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	// Element-specific colors when raid is selected
	.raid-select-button {
		&.wind {
			.raid-name,
			.chevron-icon {
				color: $wind-text-30;
			}
		}
		&.fire {
			.raid-name,
			.chevron-icon {
				color: $fire-text-30;
			}
		}
		&.water {
			.raid-name,
			.chevron-icon {
				color: $water-text-30;
			}
		}
		&.earth {
			.raid-name,
			.chevron-icon {
				color: $earth-text-30;
			}
		}
		&.dark {
			.raid-name,
			.chevron-icon {
				color: $dark-text-30;
			}
		}
		&.light {
			.raid-name,
			.chevron-icon {
				color: $light-text-30;
			}
		}
	}
</style>
