<script lang="ts">
	/**
	 * CollectionWonderEditPane - sets up a Wonder being added to the owner's
	 * collection (pushed from AddCollectionWonderPane), or edits one: Active,
	 * then the controls its kind has (uncap, level or recruited count), with
	 * the bonuses those give. The header action is Add or Save.
	 */
	import { untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import WonderStateFields from './WonderStateFields.svelte'
	import WonderBonusList from './WonderBonusList.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import {
		useAddCollectionWonder,
		useUpdateCollectionWonder
	} from '$lib/api/mutations/wonder.mutations'
	import { computeBonuses, stateOf } from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { OwnedWonder, WonderCatalogue, WonderState } from '$lib/types/api/wonder'

	type Mode = { kind: 'add'; wonderId: string } | { kind: 'edit'; row: OwnedWonder }

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		catalogue: WonderCatalogue
		mode: Mode
		/** Edit mode: called with the saved row */
		onSaved?: (row: OwnedWonder) => void
	}

	let { paneId, catalogue, mode, onSaved }: Props = $props()

	const addMutation = useAddCollectionWonder()
	const updateMutation = useUpdateCollectionWonder()

	const initialMode = untrack(() => mode)
	const initialRow = initialMode.kind === 'edit' ? initialMode.row : null

	const wonderId = initialMode.kind === 'edit' ? initialMode.row.wonderId : initialMode.wonderId
	let active = $state(initialRow?.active ?? true)
	let fields = $state<WonderState | null>(null)

	const wonder = $derived(catalogue.wonders.find((w) => w.id === wonderId))
	const current = $derived(wonder ? (fields ?? stateOf(wonder, initialRow)) : null)
	const bonuses = $derived(wonder && current ? computeBonuses(wonder, current) : [])

	const changed = $derived.by(() => {
		if (!initialRow) return !!wonder
		if (!current) return false
		return (
			active !== (initialRow.active ?? true) ||
			current.level !== initialRow.level ||
			current.evolution !== initialRow.evolution ||
			current.possession !== initialRow.possession
		)
	})
	const pending = $derived(addMutation.isPending || updateMutation.isPending)
	const canSave = $derived(changed && !pending)
	const actionLabel = initialRow ? m.action_save() : m.action_add()

	async function save() {
		if (!wonder || !current || !canSave) return
		const name = wonderText(wonder.name)
		try {
			if (initialRow) {
				const row = await updateMutation.mutateAsync({
					id: initialRow.id,
					input: { active, ...current }
				})
				toast.success(m.wonders_saved({ name }))
				onSaved?.(row)
				sidebar.pop()
			} else {
				await addMutation.mutateAsync({ wonderId: wonder.id, active, ...current })
				toast.success(m.wonders_added({ name }))
				sidebar.close()
			}
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_save_failed()))
		}
	}

	$effect(() => {
		const enabled = canSave
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(paneId, enabled ? save : undefined, actionLabel)
				sidebar.paneStack.updatePaneById(paneId, { hasUnsavedChanges: () => changed })
			} else {
				sidebar.setAction(enabled ? save : undefined, actionLabel)
			}
		})
	})
</script>

<div class="wonder-edit">
	<div class="fields">
		{#if wonder && current}
			<DetailRow label={m.wonders_active_label()} compact>
				<Switch checked={active} onCheckedChange={(v) => (active = v)} size="small" />
			</DetailRow>
			<WonderStateFields {wonder} state={current} onChange={(s) => (fields = s)} />
		{/if}
	</div>

	{#if bonuses.length > 0}
		<DetailsSection title={m.wonders_bonuses_title()}>
			<WonderBonusList {bonuses} />
		</DetailsSection>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.wonder-edit {
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
