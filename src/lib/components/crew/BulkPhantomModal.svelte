<svelte:options runes={true} />

<script lang="ts">
	import { untrack } from 'svelte'
	import { useBulkCreatePhantoms } from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import type { CreatePhantomPlayerInput } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		crewId: string
	}

	let { open = $bindable(false), crewId }: Props = $props()

	const bulkCreateMutation = useBulkCreatePhantoms()

	// State for phantom rows
	interface PhantomRow {
		id: number
		name: string
		granblueId: string
		joinedAt: string
	}

	// Use a regular variable for ID counter (doesn't need to be reactive)
	let nextId = 1
	let rows = $state<PhantomRow[]>([createEmptyRow()])

	function createEmptyRow(): PhantomRow {
		return {
			id: nextId++,
			name: '',
			granblueId: '',
			joinedAt: ''
		}
	}

	function addRow() {
		rows = [...rows, createEmptyRow()]
	}

	function removeRow(id: number) {
		if (rows.length <= 1) return
		rows = rows.filter((row) => row.id !== id)
	}

	function resetState() {
		nextId = 1
		rows = [createEmptyRow()]
	}

	// Check if we have at least one valid phantom (name is required)
	const validPhantoms = $derived(rows.filter((row) => row.name.trim()))
	const canSubmit = $derived(validPhantoms.length > 0 && !bulkCreateMutation.isPending)

	async function handleSubmit() {
		if (!canSubmit) return

		const phantoms: CreatePhantomPlayerInput[] = validPhantoms.map((row) => ({
			name: row.name.trim(),
			granblueId: row.granblueId.trim() || undefined,
			joinedAt: row.joinedAt || undefined
		}))

		try {
			await bulkCreateMutation.mutateAsync({ crewId, phantoms })
			resetState()
			open = false
		} catch (error) {
			console.error('Failed to create phantoms:', error)
		}
	}

	function handleCancel() {
		resetState()
		open = false
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			untrack(() => resetState())
		}
	})
</script>

<Dialog bind:open size="medium">
	{#snippet children()}
		<ModalHeader
			title="Add Phantom Players"
			description="Phantom players allow you to track the scores of members without accounts"
		/>

		<ModalBody>
			<div class="phantom-rows">
				<div class="row-header">
					<span class="col-name">Name</span>
					<span class="col-id">Granblue ID</span>
					<span class="col-date">Join Date</span>
					<span class="col-action"></span>
				</div>

				{#each rows as row (row.id)}
					<div class="phantom-row">
						<input
							type="text"
							class="input name-input"
							placeholder="Player name"
							bind:value={row.name}
						/>
						<input
							type="text"
							class="input id-input"
							placeholder="Optional"
							bind:value={row.granblueId}
						/>
						<input type="date" class="input date-input" bind:value={row.joinedAt} />
						<button
							type="button"
							class="remove-btn"
							onclick={() => removeRow(row.id)}
							disabled={rows.length <= 1}
							aria-label="Remove row"
						>
							<Icon name="close" size={16} />
						</button>
					</div>
				{/each}
			</div>

			<Button variant="ghost" size="small" leftIcon="plus" onclick={addRow}>
				Add Another
			</Button>

			{#if bulkCreateMutation.isError}
				<p class="error-message">
					Failed to create phantom players. Please check the inputs and try again.
				</p>
			{/if}
		</ModalBody>

		<ModalFooter
			onCancel={handleCancel}
			cancelDisabled={bulkCreateMutation.isPending}
			primaryAction={{
				label: bulkCreateMutation.isPending
					? 'Creating...'
					: `Create ${validPhantoms.length} Phantom${validPhantoms.length !== 1 ? 's' : ''}`,
				onclick: handleSubmit,
				disabled: !canSubmit
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.phantom-rows {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		margin-bottom: spacing.$unit-2x;
	}

	.row-header {
		display: grid;
		grid-template-columns: 1fr 140px 180px 32px;
		gap: spacing.$unit;
		padding: 0 spacing.$unit-half;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.phantom-row {
		display: grid;
		grid-template-columns: 1fr 140px 180px 32px;
		gap: spacing.$unit;
		align-items: center;
	}

	.input {
		padding: spacing.$unit spacing.$unit-2x;
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-regular;
		font-family: inherit;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		width: 100%;

		&:hover {
			background: var(--input-bound-bg-hover);
		}

		&:focus {
			outline: none;
			background: var(--input-bound-bg-hover);
		}

		&::placeholder {
			color: var(--text-tertiary);
		}
	}

	.date-input {
		padding: spacing.$unit-half spacing.$unit;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		border-radius: layout.$item-corner-small;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;

		&:hover:not(:disabled) {
			background: rgba(0, 0, 0, 0.06);
			color: var(--text-primary);
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}

	.error-message {
		color: var(--danger);
		font-size: typography.$font-small;
		margin: spacing.$unit 0 0;
	}

	.col-name {
		text-align: left;
	}

	.col-id,
	.col-date {
		text-align: left;
	}

	.col-action {
		width: 32px;
	}
</style>
