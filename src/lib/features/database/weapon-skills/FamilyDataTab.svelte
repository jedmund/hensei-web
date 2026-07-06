<script lang="ts">
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getBoostTypeLabel } from '$lib/utils/boostType'
	import { titleCase } from '$lib/utils/textCase'
	import type {
		DeleteImpact,
		WeaponSkillDatumRow,
		WeaponSkillFamily
	} from '$lib/types/api/weaponSkillFamily'

	interface Props {
		family: WeaponSkillFamily
		canEdit: boolean
		onMutated: () => Promise<void>
		onDelete: (doDelete: (force: boolean) => Promise<DeleteImpact>) => Promise<boolean>
	}

	let { family, canEdit, onMutated, onDelete }: Props = $props()

	const SL_FIELDS = ['sl1', 'sl10', 'sl15', 'sl20', 'sl25'] as const

	const FORMULA_OPTIONS = ['flat', 'enmity', 'stamina', 'progression', 'garrison'].map((ft) => ({
		value: ft,
		label: titleCase(ft)
	}))

	let savingId = $state<string | null>(null)
	let error = $state<string | null>(null)
	// Per-row edit buffers keyed by row id
	let edits = $state<Record<string, Record<string, string>>>({})

	function createBuffer(row: WeaponSkillDatumRow): Record<string, string> {
		return Object.fromEntries([
			...SL_FIELDS.map((f) => [f, row[f]?.toString() ?? '']),
			['coefficient', row.coefficient?.toString() ?? ''],
			['maxValue', row.maxValue?.toString() ?? ''],
			['formulaType', row.formulaType ?? 'flat']
		])
	}

	// Populate buffers in an effect, not the `{@const buffer(row)}` template call below —
	// mutating $state during template/derived evaluation throws state_unsafe_mutation.
	$effect(() => {
		for (const row of family.data) {
			if (!(row.id in edits)) {
				edits[row.id] = createBuffer(row)
			}
		}
	})

	function buffer(row: WeaponSkillDatumRow): Record<string, string> {
		return edits[row.id] ?? createBuffer(row)
	}

	async function saveRow(row: WeaponSkillDatumRow) {
		const buf = edits[row.id]
		if (!buf) return
		savingId = row.id
		error = null
		try {
			const num = (v: string) => (v === '' ? null : Number(v))
			await entityAdapter.updateWeaponSkillDatum(row.id, {
				sl1: num(buf.sl1 ?? ''),
				sl10: num(buf.sl10 ?? ''),
				sl15: num(buf.sl15 ?? ''),
				sl20: num(buf.sl20 ?? ''),
				sl25: num(buf.sl25 ?? ''),
				coefficient: num(buf.coefficient ?? ''),
				max_value: num(buf.maxValue ?? ''),
				formula_type: buf.formulaType
			})
			delete edits[row.id]
			await onMutated()
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save'
		} finally {
			savingId = null
		}
	}

	async function deleteRow(row: WeaponSkillDatumRow) {
		error = null
		try {
			await onDelete((force) => entityAdapter.deleteWeaponSkillDatum(row.id, force))
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete'
		}
	}
</script>

<div class="data-tab">
	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if family.data.length === 0}
		<p class="empty">No scaling data rows for this family.</p>
	{:else}
		<div class="table-wrapper">
			<table class="edit-table">
				<thead>
					<tr>
						<th>Boost</th>
						<th>Series</th>
						<th>Size</th>
						<th>Formula</th>
						{#each SL_FIELDS as f (f)}
							<th class="num">{f.toUpperCase()}</th>
						{/each}
						<th class="num">Coef</th>
						<th class="num">Max</th>
						{#if canEdit}
							<th></th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each family.data as row (row.id)}
						{@const buf = buffer(row)}
						<tr
							class:version-linked={!!row.weaponSkillVersionId}
							class:edited={!!row.manuallyEditedAt}
						>
							<td>
								{getBoostTypeLabel(row.boostType)}
								{#if row.weaponSkillVersionId}<span class="badge">version</span>{/if}
								{#if row.manuallyEditedAt}<span class="badge edited-badge">edited</span>{/if}
							</td>
							<td>{row.series ? titleCase(row.series) : 'Any'}</td>
							<td>{row.size ? titleCase(row.size) : '—'}</td>
							<td>
								{#if canEdit}
									<Select options={FORMULA_OPTIONS} bind:value={buf.formulaType} contained portal />
								{:else}
									{row.formulaType ? titleCase(row.formulaType) : '—'}
								{/if}
							</td>
							{#each SL_FIELDS as f (f)}
								<td class="num">
									{#if canEdit}
										<Input
											type="number"
											variant="number"
											contained
											alignRight
											bind:value={buf[f]}
											placeholder="—"
										/>
									{:else}
										{row[f] ?? '—'}
									{/if}
								</td>
							{/each}
							<td class="num">
								{#if canEdit}
									<Input
										type="number"
										variant="number"
										contained
										alignRight
										bind:value={buf.coefficient}
										placeholder="—"
									/>
								{:else}
									{row.coefficient ?? '—'}
								{/if}
							</td>
							<td class="num">
								{#if canEdit}
									<Input
										type="number"
										variant="number"
										contained
										alignRight
										bind:value={buf.maxValue}
										placeholder="—"
									/>
								{:else}
									{row.maxValue ?? '—'}
								{/if}
							</td>
							{#if canEdit}
								<td class="actions">
									<Button
										variant="secondary"
										size="small"
										onclick={() => saveRow(row)}
										disabled={savingId === row.id}
									>
										{savingId === row.id ? 'Saving…' : 'Save'}
									</Button>
									<Button variant="ghost" size="small" onclick={() => deleteRow(row)}>Delete</Button
									>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.data-tab {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.error {
		color: var(--red);
		font-size: typography.$font-small;
		margin: 0;
	}

	.empty {
		color: var(--text-tertiary);
		font-size: typography.$font-regular;
		text-align: center;
		padding: spacing.$unit-4x 0;
		margin: 0;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.edit-table {
		width: 100%;
		border-collapse: collapse;
		font-size: typography.$font-small;

		th {
			text-align: left;
			font-weight: typography.$medium;
			color: var(--text-secondary);
			padding: spacing.$unit-half spacing.$unit;
			border-bottom: 1px solid var(--table-border);
			white-space: nowrap;
		}

		td {
			padding: spacing.$unit-half spacing.$unit;
			border-bottom: 1px solid var(--table-border);
			vertical-align: middle;
			white-space: nowrap;
		}

		.num {
			text-align: right;

			// Keep the numeric editors compact in the dense grid (component default is wider).
			:global(.input.number) {
				width: 88px;
			}
		}

		// Formula dropdown: enough room for the longest label ("Progression").
		:global(.select) {
			min-width: 140px;
		}

		.actions {
			display: flex;
			gap: spacing.$unit-half;
		}
	}

	.badge {
		display: inline-block;
		margin-left: spacing.$unit-half;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		background: var(--button-bg);
		color: var(--text-tertiary);
		font-size: typography.$font-tiny;
	}

	.edited-badge {
		color: var(--orange-text, #e08a00);
	}
</style>
