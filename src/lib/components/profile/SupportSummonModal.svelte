<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import SupportSummonGrid from '$lib/components/profile/SupportSummonGrid.svelte'
	import SupportSummonPickerModal from '$lib/components/profile/SupportSummonPickerModal.svelte'
	import {
		useCreateSupportSummon,
		useUpdateSupportSummon,
		useDeleteSupportSummon,
		useToggleSupportSummonRequired
	} from '$lib/api/mutations/supportSummon.mutations'
	import { userQueries } from '$lib/api/queries/user.queries'
	import type { CollectionSummon } from '$lib/types/api/collection'
	import type { SupportSummon, SupportSummonSection } from '$lib/types/api/supportSummon'

	interface Props {
		open: boolean
		summons?: SupportSummon[]
		/** Profile owner — required for the picker's collection query. */
		userId?: string
		username?: string
		isOwner?: boolean
	}

	let { open = $bindable(false), summons = [], userId, username, isOwner = false }: Props = $props()

	const createMut = useCreateSupportSummon()
	const updateMut = useUpdateSupportSummon()
	const deleteMut = useDeleteSupportSummon()
	const requiredMut = useToggleSupportSummonRequired()

	// Subscribe to the support-summons cache so optimistic mutations propagate
	// back to the grid. The SSR-supplied `summons` prop seeds initialData.
	const summonsQuery = createQuery(() => ({
		...userQueries.supportSummons(username ?? ''),
		initialData: summons,
		enabled: !!username
	}))

	const liveSummons = $derived<SupportSummon[]>(summonsQuery.data ?? summons)

	// Picker (nested) modal state.
	let pickerOpen = $state(false)
	let pickerSection = $state<SupportSummonSection>('wind')
	let pickerPosition = $state(0)

	const existing = $derived(
		liveSummons.find((s) => s.section === pickerSection && s.position === pickerPosition)
	)

	function close() {
		open = false
	}

	function handleSelect(section: SupportSummonSection, position: number) {
		if (!isOwner || !userId) return
		pickerSection = section
		pickerPosition = position
		pickerOpen = true
	}

	function handlePick(cs: CollectionSummon) {
		if (!username) return
		const embedded = {
			id: cs.id,
			uncapLevel: cs.uncapLevel,
			transcendenceStep: cs.transcendenceStep,
			summon: cs.summon
		}
		if (existing) {
			updateMut.mutate({
				id: existing.id,
				username,
				section: pickerSection,
				position: pickerPosition,
				collectionSummonId: cs.id,
				collectionSummon: embedded
			})
		} else {
			createMut.mutate({
				username,
				section: pickerSection,
				position: pickerPosition,
				collectionSummonId: cs.id,
				collectionSummon: embedded
			})
		}
	}

	function handleClear() {
		if (!username || !existing) return
		deleteMut.mutate({ id: existing.id, username })
	}

	function handleToggleRequired(summon: SupportSummon) {
		if (!username) return
		requiredMut.mutate({ id: summon.id, username, required: !summon.required })
	}
</script>

<Dialog bind:open size="medium">
	<ModalHeader title={m.profile_support_summons()} />
	<ModalBody>
		<div class="grid-wrap">
			<SupportSummonGrid
				summons={liveSummons}
				{isOwner}
				onSelect={handleSelect}
				onToggleRequired={handleToggleRequired}
			/>
		</div>
	</ModalBody>
	<div class="footer">
		<Button variant="ghost" size="small" onclick={close}>{m.modal_close()}</Button>
	</div>

	<!--
		Nested dialog: rendering it inside the outer Dialog's content (rather
		than as a sibling) lets bits-ui recognize the nesting and apply the
		scale-down + blur effect to this outer Content via
		`[data-nested-open]` + `--bits-dialog-nested-count`.
	-->
	{#if isOwner && userId}
		<SupportSummonPickerModal
			bind:open={pickerOpen}
			{userId}
			section={pickerSection}
			position={pickerPosition}
			currentCollectionSummonId={existing?.collectionSummon?.id}
			onPick={handlePick}
			onClear={existing ? handleClear : undefined}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.grid-wrap {
		padding: $unit;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
		padding: $unit-2x;
	}
</style>
