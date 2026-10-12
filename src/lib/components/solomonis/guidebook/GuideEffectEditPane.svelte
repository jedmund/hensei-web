<script lang="ts">
	import { untrack } from 'svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { appLocale } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import type { GuidebookEntry } from '$lib/types/api/solomonis'
	import Input from '$lib/components/ui/Input.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import GuideEffectIcon from './GuideEffectIcon.svelte'
	import { formatGuideEffectName, hasValuePlaceholder, type GuidebookEntryPatch } from './guidebook'
	import { rarityLabel } from './labels'

	interface Props {
		paneId?: string
		entry: GuidebookEntry
		onSave: (patch: GuidebookEntryPatch) => void
		onRemove: () => void
	}

	let { paneId, entry, onSave, onRemove }: Props = $props()

	// Draft state, seeded once from the entry the pane was opened with
	const initial = untrack(() => ({
		count: String(entry.count),
		displayValue: entry.displayValue ?? '',
		acquiredOrder: entry.acquiredOrder === null ? '' : String(entry.acquiredOrder),
		inherited: entry.inherited,
		note: entry.note ?? ''
	}))

	// Number inputs bind numbers (or null when cleared), so compare as text
	let count = $state<string | number | null>(initial.count)
	let displayValue = $state(initial.displayValue)
	let acquiredOrder = $state<string | number | null>(initial.acquiredOrder)
	let inherited = $state(initial.inherited)
	let note = $state(initial.note)

	const showValue = $derived(hasValuePlaceholder(entry.effect))
	const previewName = $derived(
		formatGuideEffectName(entry.effect, showValue ? displayValue : null, appLocale())
	)

	const hasChanges = $derived(
		asText(count) !== initial.count ||
			displayValue !== initial.displayValue ||
			asText(acquiredOrder) !== initial.acquiredOrder ||
			inherited !== initial.inherited ||
			note !== initial.note
	)

	function asText(value: string | number | null | undefined): string {
		return value === null || value === undefined ? '' : String(value)
	}

	function parseNumber(value: string | number | null): number | null {
		const n = Number.parseInt(asText(value), 10)
		return Number.isFinite(n) ? n : null
	}

	function save() {
		if (!hasChanges) {
			sidebar.close()
			return
		}
		onSave({
			count: parseNumber(count) ?? entry.count,
			displayValue: showValue ? displayValue : entry.displayValue,
			acquiredOrder: parseNumber(acquiredOrder),
			inherited,
			note
		})
		sidebar.close()
	}

	function remove() {
		onRemove()
		sidebar.close()
	}

	// Header save action, unsaved-changes guard and the remove menu item
	$effect(() => {
		const changed = hasChanges
		untrack(() => {
			if (!paneId) return
			sidebar.setActionForPane(paneId, save, m.action_save())
			sidebar.paneStack.updatePaneById(paneId, { hasUnsavedChanges: () => changed })
			sidebar.setOverflowMenuForPane(paneId, [
				{ label: m.action_remove(), handler: remove, variant: 'danger' }
			])
		})
	})
</script>

<div class="guide-effect-edit">
	<div class="summary">
		<GuideEffectIcon effect={entry.effect} />
		<div class="summary-text">
			<span class="name">{previewName}</span>
			<span class="meta">
				{rarityLabel(entry.effect.rarity)} ·
				{entry.effect.stackable
					? m.solomonis_web_guidebook_stackable()
					: m.solomonis_web_guidebook_not_stackable()}
			</span>
		</div>
	</div>

	<div class="fields">
		{#if entry.effect.stackable}
			<SettingsRow title={m.solomonis_web_guidebook_count()}>
				{#snippet control()}
					<Input type="number" min={1} step={1} bind:value={count} contained variant="number" />
				{/snippet}
			</SettingsRow>
		{/if}

		{#if showValue}
			<SettingsRow
				title={m.solomonis_web_guidebook_display_value()}
				subtitle={m.solomonis_web_guidebook_display_value_subtitle()}
			>
				{#snippet control()}
					<Input type="text" bind:value={displayValue} maxlength={20} contained />
				{/snippet}
			</SettingsRow>
		{/if}

		<SettingsRow
			title={m.solomonis_web_guidebook_order_pickup()}
			subtitle={m.solomonis_web_guidebook_acquired_order_subtitle()}
		>
			{#snippet control()}
				<Input
					type="number"
					min={1}
					step={1}
					bind:value={acquiredOrder}
					contained
					variant="number"
				/>
			{/snippet}
		</SettingsRow>

		<SettingsRow
			title={m.solomonis_web_guidebook_inherited()}
			subtitle={m.solomonis_web_guidebook_inherited_subtitle()}
		>
			{#snippet control()}
				<Switch bind:checked={inherited} name="inherited" />
			{/snippet}
		</SettingsRow>

		<Input
			label={m.solomonis_web_guidebook_note()}
			type="text"
			bind:value={note}
			maxLength={200}
			contained
			fullWidth
		/>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.guide-effect-edit {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x;
	}

	.summary {
		display: flex;
		align-items: flex-start;
		gap: $unit-2x;
	}

	.summary-text {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.name {
		font-size: $font-regular;
		line-height: 1.4;
		color: var(--text-primary);
		overflow-wrap: anywhere;
	}

	.meta {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}
</style>
