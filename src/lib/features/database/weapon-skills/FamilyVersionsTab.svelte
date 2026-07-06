<script lang="ts">
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import { titleCase } from '$lib/utils/textCase'
	import { getWeaponImage } from '$lib/utils/images'
	import type { FamilyVersion, WeaponSkillFamily } from '$lib/types/api/weaponSkillFamily'

	interface Props {
		family: WeaponSkillFamily
		canEdit: boolean
		onMutated: () => Promise<void>
	}

	let { family, canEdit, onMutated }: Props = $props()

	// Options mirror the WeaponSkillVersion enums; "—" clears the value.
	const SERIES_OPTIONS = [
		{ value: '', label: '—' },
		...['normal', 'omega', 'ex', 'odious'].map((s) => ({ value: s, label: titleCase(s) }))
	]
	const SIZE_OPTIONS = [
		{ value: '', label: '—' },
		...['small', 'medium', 'big', 'big_ii', 'massive', 'unworldly', 'ancestral'].map((s) => ({
			value: s,
			label: titleCase(s)
		}))
	]

	let savingId = $state<string | null>(null)
	let error = $state<string | null>(null)
	let notice = $state<string | null>(null)
	let edits = $state<
		Record<
			string,
			{
				skillSeries: string
				skillSize: string
				mainHandOnly: boolean
				nameEn: string
				nameJp: string
			}
		>
	>({})

	function createBuffer(version: FamilyVersion) {
		return {
			skillSeries: version.skillSeries ?? '',
			skillSize: version.skillSize ?? '',
			mainHandOnly: version.mainHandOnly ?? false,
			nameEn: version.name?.en ?? '',
			nameJp: version.name?.ja ?? ''
		}
	}

	// Populate buffers in an effect, not the `{@const buffer(version)}` template call below —
	// mutating $state during template/derived evaluation throws state_unsafe_mutation.
	$effect(() => {
		for (const version of family.versions) {
			if (!(version.id in edits)) {
				edits[version.id] = createBuffer(version)
			}
		}
	})

	function buffer(version: FamilyVersion) {
		return edits[version.id] ?? createBuffer(version)
	}

	async function saveVersion(version: FamilyVersion) {
		const buf = edits[version.id]
		if (!buf) return
		savingId = version.id
		error = null
		notice = null
		try {
			await entityAdapter.updateWeaponSkillVersion(version.id, {
				skill_series: buf.skillSeries || null,
				skill_size: buf.skillSize || null,
				main_hand_only: buf.mainHandOnly
			})
			// Labels live on the shared skill row — only touch when actually changed.
			if (buf.nameEn !== (version.name?.en ?? '') || buf.nameJp !== (version.name?.ja ?? '')) {
				const result = await entityAdapter.updateSkillLabels(version.skillId, {
					name_en: buf.nameEn,
					name_jp: buf.nameJp
				})
				if (result.sharedByCount > 1) {
					notice = `Label updated — shared by ${result.sharedByCount} skill versions.`
				}
			}
			delete edits[version.id]
			await onMutated()
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save'
		} finally {
			savingId = null
		}
	}

	function tierLabel(version: FamilyVersion): string {
		if ((version.transcendenceStage ?? 0) > 0) return `Trans. ${version.transcendenceStage}`
		switch (version.minUncap) {
			case 4:
				return 'FLB'
			case 5:
				return 'ULB'
			default:
				return 'Base'
		}
	}
</script>

<div class="versions-tab">
	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if notice}
		<p class="notice">{notice}</p>
	{/if}

	{#if family.versions.length === 0}
		<p class="empty">No skill versions are classified into this family.</p>
	{:else}
		<div class="table-wrapper">
			<table class="edit-table">
				<thead>
					<tr>
						<th>Weapon</th>
						<th>Skill name (en / ja)</th>
						<th>Tier</th>
						<th>Series</th>
						<th>Size</th>
						<th>MH only</th>
						{#if canEdit}
							<th></th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each family.versions as version (version.id)}
						{@const buf = buffer(version)}
						<tr>
							<td>
								{#if version.weapon}
									<a href={`/database/weapons/${version.weapon.granblueId}`} class="weapon-link">
										<img
											src={getWeaponImage(
												version.weapon.granblueId,
												'square',
												version.weapon.element === 0 ? 0 : undefined
											)}
											alt=""
											class="weapon-image"
										/>
										<span class="weapon-name">{version.weapon.nameEn}</span>
									</a>
								{:else}
									—
								{/if}
							</td>
							<td class="labels">
								{#if canEdit}
									<Input bind:value={buf.nameEn} contained placeholder="Name (en)" />
									<Input bind:value={buf.nameJp} contained placeholder="Name (ja)" class="jp" />
								{:else}
									<span>{version.name?.en ?? '—'}</span>
									{#if version.name?.ja}<span class="jp">{version.name.ja}</span>{/if}
								{/if}
							</td>
							<td><span class="tier">{tierLabel(version)}</span></td>
							<td>
								{#if canEdit}
									<Select options={SERIES_OPTIONS} bind:value={buf.skillSeries} contained portal />
								{:else}
									{version.skillSeries ? titleCase(version.skillSeries) : '—'}
								{/if}
							</td>
							<td>
								{#if canEdit}
									<Select options={SIZE_OPTIONS} bind:value={buf.skillSize} contained portal />
								{:else}
									{version.skillSize ? titleCase(version.skillSize) : '—'}
								{/if}
							</td>
							<td>
								{#if canEdit}
									<Checkbox bind:checked={buf.mainHandOnly} contained />
								{:else}
									{version.mainHandOnly ? 'Yes' : '—'}
								{/if}
							</td>
							{#if canEdit}
								<td>
									<Button
										variant="secondary"
										size="small"
										onclick={() => saveVersion(version)}
										disabled={savingId === version.id}
									>
										{savingId === version.id ? 'Saving…' : 'Save'}
									</Button>
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

	.versions-tab {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.error {
		color: var(--red);
		font-size: typography.$font-small;
		margin: 0;
	}

	.notice {
		color: var(--orange-text, #e08a00);
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
		}

		// Give the enum dropdowns enough room for their longest label.
		:global(.select) {
			min-width: 120px;
		}
	}

	.weapon-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		color: var(--text-primary);
		text-decoration: none;
		min-width: 0;

		&:hover .weapon-name {
			text-decoration: underline;
		}
	}

	.weapon-image {
		width: 48px;
		height: 48px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.weapon-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.labels {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		:global(.input) {
			min-width: 200px;
		}

		.jp {
			color: var(--text-tertiary);
		}
	}

	.tier {
		display: inline-block;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		background: var(--button-bg);
		color: var(--text-secondary);
		font-size: typography.$font-tiny;
		white-space: nowrap;
	}
</style>
