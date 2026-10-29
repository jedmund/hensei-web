<script lang="ts">
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { formatTemplate, needsTemplateConfirmation, parseRuleParams } from './rule-form'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { difficultyAdapter, type DifficultyRule } from '$lib/api/adapters/difficulty.adapter'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getDifficultyComponentOptions } from '$lib/features/database/difficulties/constants'

	interface Props {
		open?: boolean
		rule?: DifficultyRule | null
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), rule = null, onOpenChange }: Props = $props()

	const isEditing = $derived(!!rule)
	const title = $derived(isEditing ? 'Edit Rule' : 'New Rule')

	const ruleTypesQuery = createQuery(() => difficultyQueries.ruleTypes())

	const componentOptions = $derived(getDifficultyComponentOptions())

	// Form state
	let name = $state('')
	let component = $state<string>('weapon')
	let ruleType = $state<string>('')
	let selectedComponent = $state<string>('weapon')
	let selectedRuleType = $state<string>('')
	let weight = $state<number>(1)
	let active = $state(true)
	let paramsText = $state('{}')
	let paramsError = $state<string | null>(null)
	let saveError = $state<string | null>(null)
	let generatedText = $state<string | null>(null)
	let replacement = $state<{ component: string; ruleType: string; text: string } | null>(null)
	let confirmReplaceOpen = $state(false)
	const ruleTypeOptions = $derived(
		(ruleTypesQuery.data?.grouped[component] ?? []).map((t) => ({ value: t, label: t }))
	)
	const definition = $derived(
		ruleTypesQuery.data?.definitions?.find((d) => d.ruleType === ruleType)
	)
	const pendingCreation = $derived(rule?.pendingOperation === 'create')

	// Select keeps local display state. Restore it when a replacement is
	// canceled, without remounting a focused dropdown inside the dialog.
	$effect(() => {
		if (!confirmReplaceOpen) {
			selectedComponent = component
			selectedRuleType = ruleType
		}
	})

	function changeSelection(nextComponent: string, nextType: string) {
		const nextDefinition = ruleTypesQuery.data?.definitions?.find((d) => d.ruleType === nextType)
		const text = formatTemplate(nextDefinition?.params ?? {})
		const next = { component: nextComponent, ruleType: nextType, text }
		if (needsTemplateConfirmation(paramsText, generatedText)) {
			replacement = next
			confirmReplaceOpen = true
		} else {
			applySelection(next)
		}
	}

	function applySelection(next: { component: string; ruleType: string; text: string }) {
		component = next.component
		ruleType = next.ruleType
		paramsText = next.text
		generatedText = next.text
		paramsError = null
		saveError = null
		replacement = null
		confirmReplaceOpen = false
	}

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
			saveError = null
			generatedText = null
			replacement = null
			confirmReplaceOpen = false
			confirmDeleteOpen = false
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
				paramsText = '{}'
				generatedText = '{}'
			}
		}
	})

	function parseParams(): Record<string, unknown> | null {
		const result = parseRuleParams(paramsText)
		paramsError = result.error
		return result.params
	}

	const canSave = $derived(
		name.trim().length > 0 &&
			ruleType.length > 0 &&
			weight >= 0 &&
			(ruleTypesQuery.data?.grouped[component] ?? []).includes(ruleType)
	)

	async function handleSave() {
		saveError = null
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
			saveError = extractErrorMessage(err, 'Failed to save rule')
			toast.error(saveError)
		}
	}

	let confirmDeleteOpen = $state(false)

	async function handleConfirmDelete() {
		if (!rule) return
		try {
			await deleteMut.mutateAsync(rule.id)
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success(pendingCreation ? 'Rule creation canceled' : 'Rule deletion staged')
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

		<DetailItem label="Component" sublabel="Which side of the team this rule scores" editable>
			<Select
				bind:value={selectedComponent}
				options={componentOptions}
				contained
				onValueChange={(value) => {
					if (value && value !== component) changeSelection(value, '')
				}}
			/>
		</DetailItem>
		<DetailItem label="Rule type" sublabel="Types available for this component" editable>
			<Select
				bind:value={selectedRuleType}
				options={ruleTypeOptions}
				contained
				placeholder={ruleTypesQuery.isLoading ? 'Loading rule types…' : 'Select a rule type'}
				disabled={!ruleTypesQuery.data}
				onValueChange={(value) => {
					if (value && value !== ruleType) changeSelection(component, value)
				}}
			/>
		</DetailItem>

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
		{#if definition}
			<p class="hint">{definition.description}. Edit the JSON below to configure this rule.</p>
			<details>
				<summary>Parameter reference</summary>
				{#each definition.parameters as parameter (parameter.key)}
					<p class="hint"><code>{parameter.key}</code>: {parameter.description}</p>
				{/each}
			</details>
			<Button variant="ghost" size="small" onclick={() => changeSelection(component, ruleType)}>
				Reset to template
			</Button>
		{:else}
			<p class="hint">Select a rule type to load its JSON template.</p>
		{/if}
		{#if ruleTypesQuery.isError}
			<p class="params-error">Could not load rule types. Reopen this dialog to retry.</p>
		{/if}
		<textarea
			bind:value={paramsText}
			aria-label="Parameters JSON"
			oninput={() => {
				paramsError = null
				saveError = null
			}}
			rows="8"
			spellcheck="false"
			class="params-input"
			class:error={!!paramsError}></textarea>
		{#if paramsError}
			<p class="params-error">{paramsError}</p>
		{/if}
		{#if saveError}<p class="params-error" role="alert">{saveError}</p>{/if}
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
	<ConfirmDialog
		bind:open={confirmReplaceOpen}
		title="Replace parameters?"
		message="This will replace the current parameters with the selected rule type’s template."
		confirmLabel="Replace"
		onconfirm={() => {
			if (replacement) applySelection(replacement)
		}}
	/>
</Dialog>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title={pendingCreation ? 'Cancel rule creation?' : 'Delete rule?'}
	message={pendingCreation
		? `"${rule?.name ?? ''}" will be removed from your pending changes.`
		: `Deletion of "${rule?.name ?? ''}" will be staged and take effect when committed.`}
	confirmLabel={pendingCreation ? 'Cancel creation' : 'Delete'}
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
