<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { artifactQueries, artifactKeys } from '$lib/api/queries/artifact.queries'
	import { artifactAdapter } from '$lib/api/adapters/artifact.adapter'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Input from '$lib/components/ui/Input.svelte'

	const queryClient = useQueryClient()

	// Get skill ID from URL
	const skillId = $derived($page.params.id)

	// Fetch skill data
	const skillQuery = createQuery(() => artifactQueries.skillById(skillId))
	const skill = $derived(skillQuery.data)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	// Editable fields
	let editData = $state({
		nameEn: '',
		nameJp: '',
		gameNameEn: '',
		gameNameJp: '',
		skillGroup: 1,
		modifier: 0,
		polarity: 'positive',
		baseValues: [] as (number | null)[],
		growth: null as number | null,
		suffixEn: '',
		suffixJp: ''
	})

	// Populate edit data when skill loads
	$effect(() => {
		if (skill) {
			editData = {
				nameEn: skill.name?.en || '',
				nameJp: skill.name?.ja || '',
				gameNameEn: skill.gameName?.en || '',
				gameNameJp: skill.gameName?.ja || '',
				skillGroup: getSkillGroupNumber(skill.skillGroup),
				modifier: skill.modifier || 0,
				polarity: skill.polarity || 'positive',
				baseValues: skill.baseValues || [],
				growth: skill.growth ?? null,
				suffixEn: skill.suffix?.en || '',
				suffixJp: skill.suffix?.ja || ''
			}
		}
	})

	async function saveChanges() {
		if (!skill?.id) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp,
				game_name_en: editData.gameNameEn || null,
				game_name_jp: editData.gameNameJp || null,
				skill_group: editData.skillGroup,
				modifier: editData.modifier,
				polarity: editData.polarity,
				base_values: editData.baseValues,
				growth: editData.growth,
				suffix_en: editData.suffixEn,
				suffix_jp: editData.suffixJp
			}

			await artifactAdapter.updateSkill(skill.id, payload)
			await queryClient.invalidateQueries({ queryKey: artifactKeys.skills })

			saveSuccess = true

			setTimeout(() => {
				goto('/database/artifact-skills')
			}, 500)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/artifact-skills')
	}

	function getSkillGroupNumber(group: string): number {
		switch (group) {
			case 'group_i':
				return 1
			case 'group_ii':
				return 2
			case 'group_iii':
				return 3
			default:
				return 1
		}
	}

	const skillGroupOptions = [
		{ value: 1, label: 'Group I (Slots 1 & 2)' },
		{ value: 2, label: 'Group II (Slot 3)' },
		{ value: 3, label: 'Group III (Slot 4)' }
	]

	const polarityOptions = [
		{ value: 'positive', label: 'Positive' },
		{ value: 'negative', label: 'Negative' }
	]

	const pageTitle = $derived(`Edit: ${skill?.name?.en ?? 'Artifact Skill'}`)
</script>

<PageMeta title={pageTitle} description="Edit artifact skill" />

<div class="page">
	{#if skillQuery.isLoading}
		<div class="loading">Loading skill...</div>
	{:else if skillQuery.isError}
		<div class="error">Failed to load skill</div>
	{:else if skill}
		<div class="content">
			<header class="header">
				<div class="left">
					<div class="modifier-badge">{skill.modifier}</div>
					<div class="info">
						<h2>{skill.name.en}</h2>
						<div class="meta">
							<span class="skill-group">{skillGroupOptions.find(o => o.value === getSkillGroupNumber(skill.skillGroup))?.label}</span>
						</div>
					</div>
				</div>
				<div class="right">
					<Button variant="secondary" size="medium" onclick={handleCancel} disabled={isSaving}>
						Cancel
					</Button>
					<Button variant="primary" size="medium" onclick={saveChanges} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</header>

			{#if saveSuccess || saveError}
				<div class="edit-controls">
					{#if saveSuccess}
						<span class="success-message">Changes saved successfully!</span>
					{/if}
					{#if saveError}
						<span class="error-message">{saveError}</span>
					{/if}
				</div>
			{/if}

			<section class="details">
				<DetailsContainer title="Display Names">
					<DetailItem label="Name (EN)" bind:value={editData.nameEn} editable={true} type="text" />
					<DetailItem label="Name (JP)" bind:value={editData.nameJp} editable={true} type="text" />
				</DetailsContainer>

				<DetailsContainer title="Game Names (for Import Matching)">
					<DetailItem
						label="Game Name (EN)"
						sublabel="Used to match skills during artifact import"
						bind:value={editData.gameNameEn}
						editable={true}
						type="text"
						placeholder="Leave blank to use display name"
					/>
					<DetailItem
						label="Game Name (JP)"
						sublabel="Used to match skills during artifact import"
						bind:value={editData.gameNameJp}
						editable={true}
						type="text"
						placeholder="Leave blank to use display name"
					/>
				</DetailsContainer>

				<DetailsContainer title="Skill Properties">
					<DetailItem
						label="Skill Group"
						bind:value={editData.skillGroup}
						editable={true}
						type="select"
						options={skillGroupOptions}
					/>
					<DetailItem
						label="Modifier"
						bind:value={editData.modifier}
						editable={true}
						type="number"
					/>
					<DetailItem
						label="Polarity"
						bind:value={editData.polarity}
						editable={true}
						type="select"
						options={polarityOptions}
					/>
					<DetailItem
						label="Growth"
						bind:value={editData.growth}
						editable={true}
						type="number"
					/>
				</DetailsContainer>

				<DetailsContainer title="Base Values (Quality 1-5)">
					{#each [0, 1, 2, 3, 4] as index}
						<DetailItem label="Quality {index + 1}" editable={true}>
							<Input
								type="number"
								variant="number"
								contained={true}
								value={editData.baseValues[index] ?? ''}
								oninput={(e) => {
									const newValues = [...editData.baseValues]
									const val = e.currentTarget.value
									newValues[index] = val === '' ? null : parseFloat(val)
									editData.baseValues = newValues
								}}
								placeholder="—"
							/>
						</DetailItem>
					{/each}
				</DetailsContainer>

				<DetailsContainer title="Suffix">
					<DetailItem
						label="Suffix (EN)"
						bind:value={editData.suffixEn}
						editable={true}
						type="text"
						placeholder="%"
					/>
					<DetailItem
						label="Suffix (JP)"
						bind:value={editData.suffixJp}
						editable={true}
						type="text"
						placeholder="%"
					/>
				</DetailsContainer>
			</section>
		</div>
	{:else}
		<div class="not-found">
			<h2>Skill Not Found</h2>
			<p>The skill you're looking for could not be found.</p>
			<button onclick={() => goto('/database/artifact-skills')}>Back to Skills</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.loading,
	.error {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: colors.$red;
	}

	.content {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		overflow: visible;
		position: relative;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		background: var(--card-bg);
		border-top-left-radius: layout.$card-corner;
		border-top-right-radius: layout.$card-corner;

		.left {
			display: flex;
			align-items: center;
			gap: spacing.$unit-2x;
		}

		.right {
			display: flex;
			gap: spacing.$unit;
			align-items: center;
		}

		.modifier-badge {
			display: flex;
			align-items: center;
			justify-content: center;
			min-width: 48px;
			height: 48px;
			padding: 0 spacing.$unit;
			background: colors.$blue;
			color: white;
			border-radius: layout.$item-corner;
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
		}

		.info {
			flex: 1;

			h2 {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit-half 0;
				color: var(--text-primary);
			}

			.meta {
				display: flex;
				flex-direction: row;
				gap: spacing.$unit;
				align-items: center;
			}

			.skill-group {
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}
	}

	.edit-controls {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-subtle);
		display: flex;
		gap: spacing.$unit;
		align-items: center;

		.success-message {
			color: var(--text-primary);
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}

		.error-message {
			color: colors.$error;
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: colors.$blue;
			color: white;
			border: none;
			padding: spacing.$unit spacing.$unit-2x;
			border-radius: layout.$item-corner;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				filter: brightness(0.9);
			}
		}
	}
</style>
