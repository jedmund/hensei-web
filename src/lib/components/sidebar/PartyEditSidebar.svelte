<script lang="ts">
	/**
	 * PartyEditSidebar - Edit party metadata (settings, performance, video)
	 *
	 * This sidebar is opened via openPartyEditSidebar() and provides
	 * editing for battle settings, clear time, metrics, video URL, and raid.
	 */
	import DetailsSection from './details/DetailsSection.svelte'
	import DetailRow from './details/DetailRow.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import BattleSettingsSection from '$lib/components/party/edit/BattleSettingsSection.svelte'
	import ClearTimeInput from '$lib/components/party/edit/ClearTimeInput.svelte'
	import YouTubeUrlInput from '$lib/components/party/edit/YouTubeUrlInput.svelte'
	import MetricField from '$lib/components/party/edit/MetricField.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import EditDescriptionPane from '$lib/components/sidebar/EditDescriptionPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'
		import { untrack } from 'svelte'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidFull } from '$lib/types/api/raid'
	import Icon from '$lib/components/Icon.svelte'

	export interface PartyEditValues {
		name: string
		description: string | null
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
		/** Current party values */
		initialValues: PartyEditValues
		/** Party element for switch theming */
		element?: ElementType
		/** Callback when save is requested */
		onSave?: (values: PartyEditValues) => void
	}

	let { initialValues, element, onSave }: Props = $props()

	// Get the pane stack for pushing EditRaidPane
	const paneStack = usePaneStack()

	// Local state - initialized from initialValues
	let name = $state(initialValues.name)
	let fullAuto = $state(initialValues.fullAuto)
	let autoGuard = $state(initialValues.autoGuard)
	let autoSummon = $state(initialValues.autoSummon)
	let chargeAttack = $state(initialValues.chargeAttack)
	let clearTime = $state(initialValues.clearTime)
	let buttonCount = $state(initialValues.buttonCount)
	let chainCount = $state(initialValues.chainCount)
	let summonCount = $state(initialValues.summonCount)
	let videoUrl = $state(initialValues.videoUrl)
	let raid = $state<Raid | null>(initialValues.raid)
	let raidId = $state<string | null>(initialValues.raidId)
	let description = $state(initialValues.description)

	// Check if any values have changed
	const hasChanges = $derived(
		name !== initialValues.name ||
			fullAuto !== initialValues.fullAuto ||
			autoGuard !== initialValues.autoGuard ||
			autoSummon !== initialValues.autoSummon ||
			chargeAttack !== initialValues.chargeAttack ||
			clearTime !== initialValues.clearTime ||
			buttonCount !== initialValues.buttonCount ||
			chainCount !== initialValues.chainCount ||
			summonCount !== initialValues.summonCount ||
			videoUrl !== initialValues.videoUrl ||
			raidId !== initialValues.raidId ||
			description !== initialValues.description
	)

	// Expose save function for sidebar action button
	export function save() {
		const values: PartyEditValues = {
			name,
			description,
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

	// Update sidebar action button state based on changes
	$effect(() => {
		// Read hasChanges to track it
		const changed = hasChanges
		// Use untrack to prevent tracking sidebar mutations
		untrack(() => {
			if (changed) {
				sidebar.setAction(save, 'Save', element)
			} else {
				sidebar.setAction(undefined, 'Save', element)
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
		if (typeof r.name === 'string') return r.name
		return r.name?.en || r.name?.ja || 'Unknown Raid'
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
							guidebooks: selectedRaid.group.guidebooks
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

	function getDescriptionPreview(desc: string | null): string {
		if (!desc) return ''
		try {
			const parsed = JSON.parse(desc)
			// Extract plain text from TipTap JSON
			const extractText = (node: { type?: string; text?: string; content?: unknown[] }): string => {
				if (node.text) return node.text
				if (node.content) return node.content.map(extractText).join('')
				return ''
			}
			return extractText(parsed).slice(0, 50) || ''
		} catch {
			// Legacy plain text
			return desc.slice(0, 50)
		}
	}

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
	<div class="top-fields">
		<Input
			label="Title"
			bind:value={name}
			placeholder="Enter party title..."
			contained
			fullWidth
		/>
		<YouTubeUrlInput label="Video" bind:value={videoUrl} contained />
	</div>

	<DetailsSection title="Content">
		<DetailRow label="Description" noHover compact>
			{#snippet children()}
				<button type="button" class="description-select-button" onclick={openDescriptionPane}>
					{#if description}
						<span class="description-preview">{getDescriptionPreview(description)}...</span>
					{:else}
						<span class="placeholder">Add description...</span>
					{/if}
					<Icon name="chevron-right" size={16} class="chevron-icon" />
				</button>
			{/snippet}
		</DetailRow>
	</DetailsSection>

	<DetailsSection title="Battle">
		<DetailRow label="Raid" noHover compact>
			{#snippet children()}
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
			{/snippet}
		</DetailRow>
	</DetailsSection>

	<BattleSettingsSection
		bind:fullAuto
		bind:autoGuard
		bind:autoSummon
		bind:chargeAttack
		{element}
		onchange={handleSettingsChange}
	/>

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

	.top-fields {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit-2x;
	}

	.raid-select-button,
	.description-select-button {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.raid-name,
	.description-preview {
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
