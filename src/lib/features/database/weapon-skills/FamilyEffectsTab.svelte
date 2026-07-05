<script lang="ts">
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import type {
		DeleteImpact,
		WeaponSkillEffectRow,
		WeaponSkillFamily
	} from '$lib/types/api/weaponSkillFamily'

	interface Props {
		family: WeaponSkillFamily
		canEdit: boolean
		onMutated: () => Promise<void>
		onDelete: (doDelete: (force: boolean) => Promise<DeleteImpact>) => Promise<boolean>
	}

	let { family, canEdit, onMutated, onDelete }: Props = $props()

	const groups = $derived([
		{
			key: 'canonical',
			label: 'Family effects',
			effects: family.effects.filter((e) => e.source === 'canonical')
		},
		{ key: 'key', label: 'Key-granted', effects: family.effects.filter((e) => e.source === 'key') },
		{
			key: 'version',
			label: 'Version-linked',
			effects: family.effects.filter((e) => e.source === 'version')
		}
	])

	let savingId = $state<string | null>(null)
	let error = $state<string | null>(null)
	let edits = $state<
		Record<string, { value: string; totalCap: string; perCopyCap: string; condition: string }>
	>({})

	function buffer(effect: WeaponSkillEffectRow) {
		if (!edits[effect.id]) {
			edits[effect.id] = {
				value: effect.value?.toString() ?? '',
				totalCap: effect.totalCap?.toString() ?? '',
				perCopyCap: effect.perCopyCap?.toString() ?? '',
				condition:
					effect.condition && Object.keys(effect.condition).length > 0
						? JSON.stringify(effect.condition)
						: ''
			}
		}
		return edits[effect.id]!
	}

	async function saveEffect(effect: WeaponSkillEffectRow) {
		const buf = edits[effect.id]
		if (!buf) return

		let condition: Record<string, unknown> | null = null
		if (buf.condition.trim()) {
			try {
				condition = JSON.parse(buf.condition)
				if (typeof condition !== 'object' || Array.isArray(condition)) throw new Error()
			} catch {
				error = 'Condition must be a JSON object'
				return
			}
		}

		savingId = effect.id
		error = null
		try {
			const num = (v: string) => (v === '' ? null : Number(v))
			await entityAdapter.updateWeaponSkillEffect(effect.id, {
				value: num(buf.value),
				total_cap: num(buf.totalCap),
				per_copy_cap: num(buf.perCopyCap),
				condition: condition ?? {}
			})
			delete edits[effect.id]
			await onMutated()
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save'
		} finally {
			savingId = null
		}
	}

	async function deleteEffect(effect: WeaponSkillEffectRow) {
		error = null
		try {
			await onDelete((force) => entityAdapter.deleteWeaponSkillEffect(effect.id, force))
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete'
		}
	}
</script>

<div class="effects-tab">
	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if family.effects.length === 0}
		<p class="empty">No effect rows for this family.</p>
	{:else}
		{#each groups as group (group.key)}
			{#if group.effects.length > 0}
				<section class="effect-group">
					<h3>{group.label}</h3>
					<div class="cards">
						{#each group.effects as effect (effect.id)}
							{@const buf = buffer(effect)}
							<div class="card" class:edited={!!effect.manuallyEditedAt}>
								<div class="card-header">
									<span class="boost">{effect.boostType}</span>
									<span class="kind">{effect.scalingKind}</span>
									{#if effect.keySlug}<span class="key-slug">{effect.keySlug}</span>{/if}
									{#if effect.series}<span class="series">{effect.series}</span>{/if}
									{#if effect.manuallyEditedAt}<span class="edited-badge">edited</span>{/if}
								</div>
								<div class="fields">
									<label>
										Value
										{#if canEdit}
											<input type="number" step="any" bind:value={buf.value} placeholder="—" />
										{:else}
											<span>{effect.value ?? '—'}</span>
										{/if}
										<span class="unit">{effect.valueUnit ?? ''}</span>
									</label>
									<label>
										Total cap
										{#if canEdit}
											<input type="number" step="any" bind:value={buf.totalCap} placeholder="—" />
										{:else}
											<span>{effect.totalCap ?? '—'}</span>
										{/if}
									</label>
									<label>
										Per-copy cap
										{#if canEdit}
											<input type="number" step="any" bind:value={buf.perCopyCap} placeholder="—" />
										{:else}
											<span>{effect.perCopyCap ?? '—'}</span>
										{/if}
									</label>
									{#if effect.sharedCapGroup}
										<label>Shared cap <span>{effect.sharedCapGroup}</span></label>
									{/if}
									<label class="condition">
										Condition
										{#if canEdit}
											<input
												type="text"
												bind:value={buf.condition}
												placeholder={'{"type": "arcarum", "eq": true}'}
											/>
										{:else}
											<span>{buf.condition || '—'}</span>
										{/if}
									</label>
								</div>
								{#if effect.notes}
									<p class="notes">{effect.notes}</p>
								{/if}
								{#if canEdit}
									<div class="actions">
										<Button
											variant="secondary"
											size="small"
											onclick={() => saveEffect(effect)}
											disabled={savingId === effect.id}
										>
											{savingId === effect.id ? 'Saving…' : 'Save'}
										</Button>
										<Button variant="ghost" size="small" onclick={() => deleteEffect(effect)}>
											Delete
										</Button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.effects-tab {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.error {
		color: var(--red);
		font-size: typography.$font-small;
		margin: 0;
	}

	.empty {
		color: var(--text-tertiary);
		text-align: center;
		padding: spacing.$unit-4x 0;
	}

	.effect-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;

		h3 {
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			margin: 0;
		}
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: spacing.$unit;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border: 1px solid var(--table-border);
		border-radius: layout.$item-corner;

		&.edited {
			border-color: var(--orange-text, #e08a00);
		}
	}

	.card-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;

		.boost {
			font-weight: typography.$medium;
		}

		.kind,
		.series,
		.key-slug {
			padding: 0 spacing.$unit-half;
			border-radius: layout.$item-corner-small;
			background: var(--button-bg);
			color: var(--text-secondary);
			font-size: typography.$font-tiny;
		}

		.edited-badge {
			color: var(--orange-text, #e08a00);
			font-size: typography.$font-tiny;
			font-weight: typography.$medium;
		}
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		label {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			font-size: typography.$font-small;
			color: var(--text-secondary);

			input {
				padding: 2px spacing.$unit-half;
				background: var(--input-bound-bg);
				border: none;
				border-radius: layout.$item-corner-small;
				font-size: typography.$font-small;
				color: var(--text-primary);
				width: 90px;
			}

			&.condition input {
				flex: 1;
				width: auto;
				font-family: monospace;
				font-size: typography.$font-tiny;
			}

			span {
				color: var(--text-primary);
			}

			.unit {
				color: var(--text-tertiary);
				font-size: typography.$font-tiny;
			}
		}
	}

	.notes {
		margin: 0;
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.actions {
		display: flex;
		gap: spacing.$unit-half;
	}
</style>
