<svelte:options runes={true} />

<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { entityQueries, entityKeys } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import type { WeaponSeries, WeaponSeriesInput } from '$lib/types/api/weaponSeries'

	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'

	const queryClient = useQueryClient()

	// Fetch weapon series list
	const seriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	// State for create/edit dialog
	let dialogOpen = $state(false)
	let editingId = $state<string | null>(null)
	let formData = $state<WeaponSeriesInput>({
		name_en: '',
		name_jp: '',
		slug: '',
		order: 0,
		extra: false,
		element_changeable: false,
		has_weapon_keys: false,
		has_awakening: false,
		has_ax_skills: false
	})
	let isSubmitting = $state(false)
	let deleteConfirmId = $state<string | null>(null)

	// Mutations
	const createSeriesMutation = createMutation(() => ({
		mutationFn: (data: WeaponSeriesInput) => entityAdapter.createWeaponSeries(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['weaponSeries'] })
			closeDialog()
		}
	}))

	const updateSeriesMutation = createMutation(() => ({
		mutationFn: ({ id, data }: { id: string; data: Partial<WeaponSeriesInput> }) =>
			entityAdapter.updateWeaponSeries(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['weaponSeries'] })
			closeDialog()
		}
	}))

	const deleteSeriesMutation = createMutation(() => ({
		mutationFn: (id: string) => entityAdapter.deleteWeaponSeries(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['weaponSeries'] })
			deleteConfirmId = null
		}
	}))

	// Generate slug from name
	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
	}

	// Open create dialog
	function openCreateDialog() {
		editingId = null
		formData = {
			name_en: '',
			name_jp: '',
			slug: '',
			order: (seriesQuery.data?.length ?? 0) + 1,
			extra: false,
			element_changeable: false,
			has_weapon_keys: false,
			has_awakening: false,
			has_ax_skills: false
		}
		dialogOpen = true
	}

	// Open edit dialog
	function openEditDialog(series: WeaponSeries) {
		editingId = series.id
		formData = {
			name_en: series.name.en,
			name_jp: series.name.ja,
			slug: series.slug,
			order: series.order,
			extra: series.extra ?? false,
			element_changeable: series.elementChangeable ?? false,
			has_weapon_keys: series.hasWeaponKeys ?? false,
			has_awakening: series.hasAwakening ?? false,
			has_ax_skills: series.hasAxSkills ?? false
		}
		dialogOpen = true
	}

	// Close dialog
	function closeDialog() {
		dialogOpen = false
		editingId = null
		isSubmitting = false
	}

	// Handle form submit
	async function handleSubmit() {
		isSubmitting = true
		try {
			if (editingId) {
				await updateSeriesMutation.mutateAsync({ id: editingId, data: formData })
			} else {
				await createSeriesMutation.mutateAsync(formData)
			}
		} catch (error) {
			console.error('Failed to save weapon series:', error)
		} finally {
			isSubmitting = false
		}
	}

	// Handle name change to auto-generate slug for new entries
	function handleNameChange(event: Event) {
		const target = event.target as HTMLInputElement
		formData.name_en = target.value
		if (!editingId && !formData.slug) {
			formData.slug = generateSlug(target.value)
		}
	}

	// Handle delete confirm
	async function handleDelete(id: string) {
		try {
			await deleteSeriesMutation.mutateAsync(id)
		} catch (error) {
			console.error('Failed to delete weapon series:', error)
		}
	}
</script>

<div class="database-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Weapon Series</h1>
			<p class="subtitle">Manage weapon series categories</p>
		</div>
		<Button variant="primary" size="small" onclick={openCreateDialog}>
			Add Series
		</Button>
	</div>

	{#if seriesQuery.isPending}
		<div class="loading">Loading weapon series...</div>
	{:else if seriesQuery.error}
		<div class="error">Failed to load weapon series</div>
	{:else if seriesQuery.data}
		<div class="series-table">
			<table>
				<thead>
					<tr>
						<th class="order">Order</th>
						<th class="name">Name (EN)</th>
						<th class="name-ja">Name (JA)</th>
						<th class="slug">Slug</th>
						<th class="flags">Flags</th>
						<th class="count">Weapons</th>
						<th class="actions">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each seriesQuery.data.sort((a, b) => a.order - b.order) as series (series.id)}
						<tr>
							<td class="order">{series.order}</td>
							<td class="name">{series.name.en}</td>
							<td class="name-ja">{series.name.ja}</td>
							<td class="slug"><code>{series.slug}</code></td>
							<td class="flags">
								{#if series.extra}<span class="flag">Extra</span>{/if}
								{#if series.elementChangeable}<span class="flag">Element</span>{/if}
								{#if series.hasWeaponKeys}<span class="flag">Keys</span>{/if}
								{#if series.hasAwakening}<span class="flag">Awaken</span>{/if}
								{#if series.hasAxSkills}<span class="flag">AX</span>{/if}
							</td>
							<td class="count">{series.weaponCount ?? '—'}</td>
							<td class="actions">
								<Button variant="ghost" size="small" onclick={() => openEditDialog(series)}>
									Edit
								</Button>
								{#if deleteConfirmId === series.id}
									<Button
										variant="destructive"
										size="small"
										onclick={() => handleDelete(series.id)}
										disabled={deleteSeriesMutation.isPending}
									>
										Confirm
									</Button>
									<Button variant="ghost" size="small" onclick={() => (deleteConfirmId = null)}>
										Cancel
									</Button>
								{:else}
									<Button
										variant="ghost"
										size="small"
										onclick={() => (deleteConfirmId = series.id)}
									>
										Delete
									</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Create/Edit Dialog -->
<Dialog bind:open={dialogOpen} title={editingId ? 'Edit Weapon Series' : 'Add Weapon Series'}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }}>
		<div class="form-grid">
			<div class="form-group">
				<label for="name_en">Name (English)</label>
				<input
					id="name_en"
					type="text"
					class="text-input"
					value={formData.name_en}
					oninput={handleNameChange}
					placeholder="e.g., Dark Opus"
					required
				/>
			</div>

			<div class="form-group">
				<label for="name_jp">Name (Japanese)</label>
				<input
					id="name_jp"
					type="text"
					class="text-input"
					bind:value={formData.name_jp}
					placeholder="e.g., 終末の神器"
					required
				/>
			</div>

			<div class="form-group">
				<label for="slug">Slug</label>
				<input
					id="slug"
					type="text"
					class="text-input"
					bind:value={formData.slug}
					placeholder="e.g., dark-opus"
					required
				/>
			</div>

			<div class="form-group">
				<label for="order">Order</label>
				<input
					id="order"
					type="number"
					class="text-input"
					bind:value={formData.order}
					required
				/>
			</div>

			<div class="form-group checkboxes">
				<label>
					<input type="checkbox" bind:checked={formData.extra} />
					Extra (Additional Weapons)
				</label>
				<label>
					<input type="checkbox" bind:checked={formData.element_changeable} />
					Element Changeable
				</label>
				<label>
					<input type="checkbox" bind:checked={formData.has_weapon_keys} />
					Has Weapon Keys
				</label>
				<label>
					<input type="checkbox" bind:checked={formData.has_awakening} />
					Has Awakening
				</label>
				<label>
					<input type="checkbox" bind:checked={formData.has_ax_skills} />
					Has AX Skills
				</label>
			</div>
		</div>
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={closeDialog} disabled={isSubmitting}>
			Cancel
		</Button>
		<Button variant="primary" onclick={handleSubmit} disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
		</Button>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		padding: spacing.$unit-4x;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: spacing.$unit-4x;

		.header-content {
			h1 {
				font-size: typography.$font-xxlarge;
				font-weight: typography.$bold;
				margin-bottom: spacing.$unit-half;
			}

			.subtitle {
				font-size: typography.$font-regular;
				color: colors.$grey-50;
			}
		}
	}

	.loading,
	.error {
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$grey-50;
	}

	.error {
		color: var(--text-error, #ef4444);
	}

	.series-table {
		overflow-x: auto;

		table {
			width: 100%;
			border-collapse: collapse;
			background: colors.$grey-90;
			border-radius: 8px;
			overflow: hidden;
		}

		th,
		td {
			padding: spacing.$unit-2x spacing.$unit-3x;
			text-align: left;
			border-bottom: 1px solid colors.$grey-85;
		}

		th {
			background: colors.$grey-85;
			font-weight: typography.$medium;
			font-size: typography.$font-small;
			color: colors.$grey-40;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		td {
			font-size: typography.$font-regular;
		}

		.order {
			width: 60px;
			text-align: center;
		}

		.name,
		.name-ja {
			min-width: 150px;
		}

		.slug code {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: typography.$font-small;
			background: colors.$grey-80;
			padding: spacing.$unit-fourth spacing.$unit-half;
			border-radius: 4px;
		}

		.flags {
			.flag {
				display: inline-block;
				font-size: typography.$font-tiny;
				padding: spacing.$unit-fourth spacing.$unit-half;
				margin-right: spacing.$unit-half;
				background: colors.$grey-80;
				border-radius: 4px;
				color: colors.$grey-30;
			}
		}

		.count {
			width: 80px;
			text-align: center;
		}

		.actions {
			width: 200px;
			display: flex;
			gap: spacing.$unit;
		}

		tbody tr:hover {
			background: colors.$grey-85;
		}
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;

		> label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: colors.$grey-30;
		}

		&.checkboxes {
			gap: spacing.$unit-2x;

			label {
				display: flex;
				align-items: center;
				gap: spacing.$unit;
				font-weight: typography.$normal;
				cursor: pointer;

				input[type='checkbox'] {
					width: 16px;
					height: 16px;
					cursor: pointer;
				}
			}
		}
	}

	.text-input {
		padding: spacing.$unit-2x;
		background: colors.$grey-85;
		border: 1px solid colors.$grey-80;
		border-radius: 6px;
		color: colors.$grey-10;
		font-size: typography.$font-regular;

		&:focus {
			outline: none;
			border-color: colors.$grey-60;
		}

		&::placeholder {
			color: colors.$grey-60;
		}
	}
</style>
