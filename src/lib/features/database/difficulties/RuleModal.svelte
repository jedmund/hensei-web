<script lang="ts">
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { difficultyAdapter, type DifficultyRule } from '$lib/api/adapters/difficulty.adapter'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		open?: boolean
		rule?: DifficultyRule | null
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), rule = null, onOpenChange }: Props = $props()

	const isEditing = $derived(!!rule)
	const title = $derived(isEditing ? 'Edit Rule' : 'New Rule')

	const ruleTypesQuery = createQuery(() => difficultyQueries.ruleTypes())
	const ruleTypeOptions = $derived(
		(ruleTypesQuery.data?.types ?? []).map((t) => ({ value: t, label: t }))
	)

	const componentOptions = [
		{ value: 'weapon', label: 'Weapon' },
		{ value: 'character', label: 'Character' },
		{ value: 'summon', label: 'Summon' },
		{ value: 'job', label: 'Job' },
		{ value: 'accessory', label: 'Accessory' }
	]

	// Form state
	let name = $state('')
	let component = $state<string>('weapon')
	let ruleType = $state<string>('')
	let weight = $state<number>(1)
	let active = $state(true)
	let paramsText = $state('{}')
	let paramsError = $state<string | null>(null)

	const queryClient = useQueryClient()

	const createMut = createMutation(() => ({
		mutationFn: (data: Partial<DifficultyRule>) => difficultyAdapter.createRule(data)
	}))
	const updateMut = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyRule> }) =>
			difficultyAdapter.updateRule(input.id, input.data)
	}))
	const deleteMut = createMutation(() => ({
		mutationFn: (id: string) => difficultyAdapter.deleteRule(id)
	}))

	const isSaving = $derived(createMut.isPending || updateMut.isPending)
	const isDeleting = $derived(deleteMut.isPending)

	$effect(() => {
		if (open) {
			paramsError = null
			if (rule) {
				name = rule.name ?? ''
				component = rule.component ?? 'weapon'
				ruleType = rule.ruleType ?? ''
				weight = rule.weight ?? 1
				active = rule.active ?? true
				paramsText = JSON.stringify(rule.params ?? {}, null, 2)
			} else {
				name = ''
				component = 'weapon'
				ruleType = ''
				weight = 1
				active = true
				paramsText = '{\n  "min_count": 1\n}'
			}
		}
	})

	function parseParams(): Record<string, unknown> | null {
		try {
			const parsed = JSON.parse(paramsText || '{}')
			if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
				paramsError = 'Params must be a JSON object.'
				return null
			}
			paramsError = null
			return parsed as Record<string, unknown>
		} catch (err) {
			paramsError = err instanceof Error ? err.message : 'Invalid JSON.'
			return null
		}
	}

	const canSave = $derived(name.trim().length > 0 && ruleType.length > 0 && weight >= 0)

	async function handleSave() {
		const params = parseParams()
		if (params === null) {
			toast.error('Fix the params JSON before saving.')
			return
		}
		if (!canSave) {
			toast.error('Name, rule type, and a non-negative weight are required.')
			return
		}

		const payload: Partial<DifficultyRule> = {
			name: name.trim(),
			component,
			ruleType,
			weight,
			active,
			params
		}

		try {
			if (isEditing && rule) {
				await updateMut.mutateAsync({ id: rule.id, data: payload })
			} else {
				await createMut.mutateAsync(payload)
			}
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success(isEditing ? 'Rule change staged' : 'Rule creation staged')
			open = false
			onOpenChange?.(false)
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Failed to save rule'))
		}
	}

	let confirmDeleteOpen = $state(false)

	async function handleConfirmDelete() {
		if (!rule) return
		try {
			await deleteMut.mutateAsync(rule.id)
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success('Rule deletion staged')
			confirmDeleteOpen = false
			open = false
			onOpenChange?.(false)
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Failed to delete rule'))
		}
	}
</script>

<Dialog bind:open {onOpenChange} size="small">
	<ModalHeader
		{title}
		description="Each rule contributes its weight to its component sub-score when its condition fires."
	/>
	<div class="modal-body">
		<DetailItem
			label="Name"
			bind:value={name}
			editable={true}
			type="text"
			placeholder="e.g. Grand series weapon present"
			width="320px"
		/>
		<DetailItem
			label="Component"
			sublabel="Which side of the team this rule scores"
			bind:value={component}
			editable={true}
			type="select"
			options={componentOptions}
		/>
		<DetailItem
			label="Rule type"
			sublabel="Available types are defined in the API"
			bind:value={ruleType}
			editable={true}
			type="select"
			options={ruleTypeOptions}
			placeholder="Select a rule type"
		/>
		<DetailItem
			label="Weight"
			sublabel="Contribution to the component sub-score when the rule fires"
			bind:value={weight}
			editable={true}
			type="number"
			min={0}
		/>
		<DetailItem
			label="Active"
			sublabel="Inactive rules are skipped during scoring"
			bind:value={active}
			editable={true}
			type="checkbox"
		/>

		<h4 class="section-header">Parameters</h4>
		<p class="hint">Each rule type expects specific keys. See the API for the full schema.</p>
		<textarea
			bind:value={paramsText}
			rows="8"
			spellcheck="false"
			class="params-input"
			class:error={!!paramsError}
		></textarea>
		{#if paramsError}
			<p class="params-error">{paramsError}</p>
		{/if}
	</div>
	<ModalFooter
		onCancel={() => (open = false)}
		primaryAction={{
			label: isSaving ? 'Saving…' : isEditing ? 'Save' : 'Create',
			onclick: handleSave,
			disabled: isSaving || isDeleting || !canSave
		}}
	>
		{#snippet left()}
			{#if isEditing}
				<Button
					variant="destructive-ghost"
					size="small"
					onclick={() => (confirmDeleteOpen = true)}
					disabled={isDeleting || isSaving}
				>
					{isDeleting ? 'Deleting…' : 'Delete'}
				</Button>
			{/if}
		{/snippet}
	</ModalFooter>
</Dialog>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete rule?"
	message={`"${rule?.name ?? ''}" will be removed and stop contributing to the score.`}
	confirmLabel="Delete"
	loading={isDeleting}
	onconfirm={handleConfirmDelete}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		padding-top: 0;
		max-height: 70vh;
		overflow-y: auto;
	}

	.section-header {
		margin: spacing.$unit 0 0 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-secondary);
	}

	.hint {
		margin: 0;
		color: var(--text-tertiary);
		font-size: typography.$font-small;
	}

	.params-input {
		width: 100%;
		min-height: 160px;
		padding: spacing.$unit;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$input-corner;
		background: var(--input-bg);
		color: var(--text-primary);
		font: inherit;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: typography.$font-small;
		resize: vertical;
		white-space: pre;

		&:focus {
			outline: 2px solid var(--focus-ring);
			outline-offset: -1px;
			border-color: transparent;
		}

		&.error {
			border-color: var(--danger);
		}
	}

	.params-error {
		margin: 0;
		color: var(--danger);
		font-size: typography.$font-small;
	}
</style>
