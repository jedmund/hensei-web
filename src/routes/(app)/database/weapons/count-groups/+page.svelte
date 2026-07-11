<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityAdapter, type WeaponCountGroup } from '$lib/api/adapters/entity.adapter'
	import PageMeta from '$lib/components/PageMeta.svelte'

	type GroupBuffer = {
		slug: string
		nameEn: string
		nameJp: string
		notes: string
		weaponGranblueIdsText: string
	}

	const queryClient = useQueryClient()
	const groupsQuery = createQuery(() => ({
		queryKey: ['weaponCountGroups'],
		queryFn: () => entityAdapter.getWeaponCountGroups()
	}))

	let searchTerm = $state('')
	let savingId = $state<string | null>(null)
	let errorMessage = $state('')
	let successMessage = $state('')
	let buffers = $state<Record<string, GroupBuffer>>({})
	let newGroup = $state<GroupBuffer>({
		slug: '',
		nameEn: '',
		nameJp: '',
		notes: '',
		weaponGranblueIdsText: ''
	})

	const groups = $derived(groupsQuery.data ?? [])
	const filteredGroups = $derived.by(() => {
		const term = searchTerm.trim().toLowerCase()
		if (!term) return groups
		return groups.filter(
			(group) =>
				group.slug.toLowerCase().includes(term) ||
				group.nameEn.toLowerCase().includes(term) ||
				group.nameJp?.toLowerCase().includes(term)
		)
	})

	function bufferFromGroup(group: WeaponCountGroup): GroupBuffer {
		return {
			slug: group.slug,
			nameEn: group.nameEn,
			nameJp: group.nameJp ?? '',
			notes: group.notes ?? '',
			weaponGranblueIdsText: group.weaponGranblueIds.join('\n')
		}
	}

	function bufferFor(group: WeaponCountGroup): GroupBuffer {
		const existing = buffers[group.id]
		if (existing) return existing

		const buffer = bufferFromGroup(group)
		buffers[group.id] = buffer
		return buffer
	}

	function parseWeaponIds(text: string): string[] {
		return text
			.split(/[\s,]+/)
			.map((id) => id.trim())
			.filter(Boolean)
	}

	function payloadFrom(buffer: GroupBuffer): Record<string, unknown> {
		return {
			slug: buffer.slug.trim(),
			name_en: buffer.nameEn.trim(),
			name_jp: buffer.nameJp.trim() || null,
			notes: buffer.notes.trim() || null,
			weapon_granblue_ids: parseWeaponIds(buffer.weaponGranblueIdsText)
		}
	}

	async function refreshGroups() {
		await queryClient.invalidateQueries({ queryKey: ['weaponCountGroups'] })
	}

	async function createGroup() {
		errorMessage = ''
		successMessage = ''
		savingId = 'new'
		try {
			await entityAdapter.createWeaponCountGroup(payloadFrom(newGroup))
			newGroup = { slug: '', nameEn: '', nameJp: '', notes: '', weaponGranblueIdsText: '' }
			successMessage = 'Created count group.'
			await refreshGroups()
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create count group.'
		} finally {
			savingId = null
		}
	}

	async function saveGroup(group: WeaponCountGroup, buffer: GroupBuffer) {
		errorMessage = ''
		successMessage = ''
		savingId = group.id
		try {
			const saved = await entityAdapter.updateWeaponCountGroup(group.id, payloadFrom(buffer))
			buffers[group.id] = bufferFromGroup(saved)
			successMessage = `Saved ${saved.slug}.`
			await refreshGroups()
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to save count group.'
		} finally {
			savingId = null
		}
	}

	async function deleteGroup(group: WeaponCountGroup) {
		if (!confirm(`Delete ${group.slug}?`)) return
		errorMessage = ''
		successMessage = ''
		savingId = group.id
		try {
			await entityAdapter.deleteWeaponCountGroup(group.id)
			delete buffers[group.id]
			successMessage = `Deleted ${group.slug}.`
			await refreshGroups()
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to delete count group.'
		} finally {
			savingId = null
		}
	}
</script>

<PageMeta title="Weapon Count Groups" description="DB-owned weapon count group memberships" />

<div class="page">
	<div class="panel">
		<div class="toolbar">
			<input
				class="search"
				type="text"
				placeholder="Search count groups..."
				bind:value={searchTerm}
			/>
			<div class="count">{filteredGroups.length} groups</div>
		</div>

		{#if errorMessage}
			<div class="message error">{errorMessage}</div>
		{/if}
		{#if successMessage}
			<div class="message success">{successMessage}</div>
		{/if}

		<section class="new-group">
			<h2>New Count Group</h2>
			<div class="group-form compact">
				<label>
					<span>Slug</span>
					<input bind:value={newGroup.slug} placeholder="convergence-example" />
				</label>
				<label>
					<span>Name</span>
					<input bind:value={newGroup.nameEn} placeholder="Convergence Example" />
				</label>
				<label>
					<span>JP Name</span>
					<input bind:value={newGroup.nameJp} />
				</label>
				<label class="wide">
					<span>Notes</span>
					<input bind:value={newGroup.notes} />
				</label>
				<label class="ids">
					<span>Weapon Granblue IDs</span>
					<textarea bind:value={newGroup.weaponGranblueIdsText} rows="3"></textarea>
				</label>
				<button class="primary" onclick={createGroup} disabled={savingId === 'new'}>
					{savingId === 'new' ? 'Creating...' : 'Create'}
				</button>
			</div>
		</section>

		{#if groupsQuery.isLoading}
			<div class="loading">Loading count groups...</div>
		{:else if groupsQuery.isError}
			<div class="message error">Failed to load count groups.</div>
		{:else}
			<div class="groups">
				{#each filteredGroups as group (group.id)}
					{@const buffer = bufferFor(group)}
					<section class="group-row">
						<div class="row-header">
							<div>
								<h2>{group.nameEn}</h2>
								<code>group:{group.slug}</code>
							</div>
							<div class="membership-count">{group.weaponCount} weapons</div>
						</div>

						<div class="group-form">
							<label>
								<span>Slug</span>
								<input bind:value={buffer.slug} />
							</label>
							<label>
								<span>Name</span>
								<input bind:value={buffer.nameEn} />
							</label>
							<label>
								<span>JP Name</span>
								<input bind:value={buffer.nameJp} />
							</label>
							<label class="wide">
								<span>Notes</span>
								<input bind:value={buffer.notes} />
							</label>
							<label class="ids">
								<span>Weapon Granblue IDs</span>
								<textarea bind:value={buffer.weaponGranblueIdsText} rows="5"></textarea>
							</label>
							<div class="actions">
								<button
									class="primary"
									onclick={() => saveGroup(group, buffer)}
									disabled={savingId === group.id}
								>
									{savingId === group.id ? 'Saving...' : 'Save'}
								</button>
								<button
									class="danger"
									onclick={() => deleteGroup(group)}
									disabled={savingId === group.id}
								>
									Delete
								</button>
							</div>
						</div>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.panel {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border-bottom: 1px solid var(--table-border);
	}

	.search {
		flex: 1;
	}

	input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: spacing.$unit;
		background: var(--input-bound-bg);
		border: none;
		border-radius: layout.$item-corner;
		color: var(--text-primary);
		font: inherit;
	}

	textarea {
		min-height: 84px;
		resize: vertical;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: typography.$font-small;
	}

	button {
		border: none;
		border-radius: layout.$item-corner;
		padding: spacing.$unit spacing.$unit-2x;
		color: white;
		cursor: pointer;

		&:disabled {
			opacity: 0.6;
			cursor: wait;
		}
	}

	.primary {
		background: var(--blue);
	}

	.danger {
		background: var(--red);
	}

	.count,
	label span,
	code {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.message {
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid var(--table-border);
		font-size: typography.$font-small;
	}

	.error {
		background: rgba(194, 52, 52, 0.12);
		color: var(--red);
	}

	.success {
		background: rgba(52, 143, 81, 0.12);
		color: var(--green);
	}

	.new-group,
	.group-row {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--table-border);
	}

	h2 {
		margin: 0 0 spacing.$unit-half 0;
		font-size: typography.$font-large;
	}

	.row-header {
		display: flex;
		justify-content: space-between;
		gap: spacing.$unit;
		margin-bottom: spacing.$unit;
	}

	.group-form {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: spacing.$unit;
		align-items: end;

		label {
			display: grid;
			gap: spacing.$unit-half;
		}
	}

	.wide,
	.ids {
		grid-column: 1 / -1;
	}

	.actions {
		display: flex;
		gap: spacing.$unit;
	}

	.loading {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
	}

	@media (max-width: 760px) {
		.group-form {
			grid-template-columns: 1fr;
		}

		.row-header {
			display: grid;
		}
	}
</style>
