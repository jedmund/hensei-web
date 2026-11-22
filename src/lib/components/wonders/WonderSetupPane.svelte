<script lang="ts">
	/**
	 * WonderSetupPane - sets up one Wonder: Active (where the flow has it),
	 * then the controls its kind has (uncap, level or recruited count), with
	 * the bonuses those give. Shared by the collection and a team's Wonders.
	 *
	 * With a `row` it edits that row: the header action is Save, enabled once
	 * something changes. Without one it sets up a new Wonder from its
	 * defaults: the header action is Add, enabled at once. Leaving unedited
	 * is never an unsaved change. The caller saves, toasts and
	 * navigates; `remove` adds a confirmed Remove to the overflow menu.
	 */
	import { onMount, untrack } from 'svelte'
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import WonderStateFields from './WonderStateFields.svelte'
	import WonderBonusList from './WonderBonusList.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { computeBonuses, stateOf } from '$lib/features/wonders/wonders'
	import type { OwnedWonder, Wonder, WonderState } from '$lib/types/api/wonder'

	interface WonderRemoval {
		/** The overflow menu item, and the confirmation's title and button */
		label: string
		/** The confirmation's message */
		message: string
		onRemove: () => Promise<void>
	}

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		wonder: Wonder
		/** The row being edited; leave it out to set up a new Wonder */
		row?: OwnedWonder | null
		/** Show the Active switch (collection rows; team rows are always active) */
		showActive?: boolean
		onSubmit: (state: WonderState, active: boolean) => Promise<void>
		remove?: WonderRemoval
	}

	let { paneId, wonder, row = null, showActive = true, onSubmit, remove }: Props = $props()

	const initialRow = untrack(() => row)
	const initialActive = initialRow?.active ?? true
	const removal = untrack(() => remove)

	let active = $state(initialActive)
	let fields = $state<WonderState | null>(null)
	let pending = $state(false)
	let confirmOpen = $state(false)

	const start = $derived(stateOf(wonder, initialRow))
	const current = $derived(fields ?? start)
	const bonuses = $derived(computeBonuses(wonder, current))

	// Edited: differs from where the pane started (the row, or a new
	// Wonder's defaults)
	const edited = $derived(
		(showActive && active !== initialActive) ||
			current.level !== start.level ||
			current.evolution !== start.evolution ||
			current.possession !== start.possession
	)
	const canSubmit = $derived((initialRow ? edited : true) && !pending)
	const actionLabel = initialRow ? m.action_save() : m.action_add()

	async function submit() {
		if (!canSubmit) return
		pending = true
		try {
			await onSubmit(current, active)
		} finally {
			pending = false
		}
	}

	async function confirmRemove() {
		if (!removal || pending) return
		pending = true
		try {
			await removal.onRemove()
		} finally {
			pending = false
			confirmOpen = false
		}
	}

	$effect(() => {
		const enabled = canSubmit
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(paneId, enabled ? submit : undefined, actionLabel)
				sidebar.paneStack.updatePaneById(paneId, { hasUnsavedChanges: () => edited })
			} else {
				sidebar.setAction(enabled ? submit : undefined, actionLabel)
			}
		})
	})

	onMount(() => {
		if (!removal || !paneId) return
		sidebar.setOverflowMenuForPane(paneId, [
			{ label: removal.label, handler: () => (confirmOpen = true), variant: 'danger' }
		])
	})
</script>

<div class="wonder-setup">
	<div class="fields">
		{#if showActive}
			<DetailRow label={m.wonders_active_label()} compact>
				<Switch checked={active} onCheckedChange={(v) => (active = v)} size="small" />
			</DetailRow>
		{/if}
		<WonderStateFields {wonder} state={current} onChange={(s) => (fields = s)} />
	</div>

	{#if bonuses.length > 0}
		<DetailsSection title={m.wonders_bonuses_title()}>
			<WonderBonusList {bonuses} />
		</DetailsSection>
	{/if}
</div>

{#if removal}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={removal.label}
		message={removal.message}
		confirmLabel={removal.label}
		loading={pending}
		onconfirm={confirmRemove}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.wonder-setup {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-bottom: $unit-2x;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: calc($unit * 1.5);
		padding: $unit-2x $unit 0;
	}
</style>
