<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import type { ArtifactSkill } from '$lib/types/api/artifact'

	// Fetch all skills
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Search state
	let searchTerm = $state('')

	// Filter skills based on search
	const filteredSkills = $derived.by(() => {
		const skills = skillsQuery.data ?? []
		if (!searchTerm.trim()) return skills

		const term = searchTerm.toLowerCase()
		return skills.filter(
			(skill) =>
				skill.name.en.toLowerCase().includes(term) ||
				skill.name.ja?.toLowerCase().includes(term) ||
				skill.gameName?.en?.toLowerCase().includes(term) ||
				skill.gameName?.ja?.toLowerCase().includes(term) ||
				skill.modifier.toString().includes(term) ||
				skill.skillGroup.toLowerCase().includes(term)
		)
	})

	// Group skills by slot group
	const groupedSkills = $derived.by(() => {
		const skills = [...filteredSkills]

		// Sort by modifier within each group
		skills.sort((a, b) => a.modifier - b.modifier)

		return {
			group_i: skills.filter((s) => s.skillGroup === 'group_i'),
			group_ii: skills.filter((s) => s.skillGroup === 'group_ii'),
			group_iii: skills.filter((s) => s.skillGroup === 'group_iii')
		}
	})

	const totalCount = $derived(
		groupedSkills.group_i.length + groupedSkills.group_ii.length + groupedSkills.group_iii.length
	)

	function handleRowClick(skill: ArtifactSkill) {
		goto(`/database/artifact-skills/${skill.id}`)
	}

	function getPolarityClass(polarity: string): string {
		return polarity === 'positive' ? 'positive' : 'negative'
	}
</script>

<PageMeta title="Artifact Skills" description="Database of artifact skills" />

<div class="page">
	<div class="grid-container">
		<div class="controls">
			<input type="text" placeholder="Search skills..." bind:value={searchTerm} class="search" />
		</div>

		{#if skillsQuery.isLoading}
			<div class="loading">Loading skills...</div>
		{:else if skillsQuery.isError}
			<div class="error">Failed to load skills</div>
		{:else}
			{#each [{ key: 'group_i', label: 'Group I — Slots 1 & 2', skills: groupedSkills.group_i }, { key: 'group_ii', label: 'Group II — Slot 3', skills: groupedSkills.group_ii }, { key: 'group_iii', label: 'Group III — Slot 4', skills: groupedSkills.group_iii }] as group (group.key)}
				{#if group.skills.length > 0}
					<div class="group-section">
						<h3 class="group-header">{group.label}</h3>
						<div class="table-wrapper">
							<table class="data-table">
								<thead>
									<tr>
										<th class="col-modifier">Mod</th>
										<th class="col-name">Display Name</th>
										<th class="col-game-name">Game Name</th>
										<th class="col-polarity">Polarity</th>
										<th class="col-values">Base Values</th>
									</tr>
								</thead>
								<tbody>
									{#each group.skills as skill (skill.id)}
										<tr onclick={() => handleRowClick(skill)} class="clickable">
											<td class="col-modifier">
												<span class="modifier-badge">{skill.modifier}</span>
											</td>
											<td class="col-name">
												<div class="name-cell">
													<span class="name-en">{skill.name.en}</span>
													{#if skill.name.ja}
														<span class="name-jp">{skill.name.ja}</span>
													{/if}
												</div>
											</td>
											<td class="col-game-name">
												<div class="name-cell">
													{#if skill.gameName?.en || skill.gameName?.ja}
														<span class="name-en">{skill.gameName?.en || '—'}</span>
														{#if skill.gameName?.ja}
															<span class="name-jp">{skill.gameName.ja}</span>
														{/if}
													{:else}
														<span class="not-set">Not set</span>
													{/if}
												</div>
											</td>
											<td class="col-polarity">
												<span class="polarity-badge {getPolarityClass(skill.polarity)}">
													{skill.polarity}
												</span>
											</td>
											<td class="col-values">
												<span class="values">
													{skill.baseValues.map((v) => v ?? '?').join(', ')}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			{/each}

			<div class="footer">
				Showing {totalCount} of {skillsQuery.data?.length ?? 0} skills
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.grid-container {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-bottom: 1px solid #e5e5e5;
		gap: spacing.$unit;

		.search {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;
			width: 100%;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				box-shadow: 0 0 0 2px colors.$blue;
			}
		}
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

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit-2x spacing.$unit;
			text-align: left;
			border-bottom: 1px solid #dee2e6;
		}

		th {
			background: #f8f9fa;
			font-weight: typography.$bold;
			color: #495057;
			white-space: nowrap;
		}

		tbody tr {
			&.clickable {
				cursor: pointer;

				&:hover {
					background: #f8f9fa;
				}
			}
		}
	}

	.group-section {
		&:not(:first-child) {
			border-top: 1px solid rgba(0, 0, 0, 0.06);
		}
	}

	.group-header {
		display: flex;
		align-items: center;
		margin: 0;
		padding: spacing.$unit spacing.$unit-2x;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.col-modifier {
		width: 60px;
		padding-left: spacing.$unit-2x !important;
	}

	.col-name {
		min-width: 160px;
	}

	.col-game-name {
		min-width: 160px;
	}

	.col-group {
		width: 140px;
	}

	.col-polarity {
		width: 100px;
	}

	.col-values {
		width: 150px;
	}

	.modifier-badge {
		display: inline-block;
		padding: 2px 8px;
		background: colors.$grey-90;
		border-radius: 4px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: colors.$grey-30;
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.name-en {
			font-weight: typography.$medium;
		}

		.name-jp {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}

		.not-set {
			color: var(--text-tertiary);
			font-style: italic;
		}
	}

	.group-badge {
		display: inline-block;
		padding: 2px 8px;
		background: colors.$blue;
		color: white;
		border-radius: 4px;
		font-size: typography.$font-small;
	}

	.polarity-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.positive {
			background: colors.$wind-bg-00;
			color: white;
		}

		&.negative {
			background: colors.$red;
			color: white;
		}
	}

	.values {
		font-size: typography.$font-small;
		color: colors.$grey-40;
		font-family: monospace;
	}

	.footer {
		padding: spacing.$unit;
		text-align: center;
		color: var(--text-secondary);
		font-size: typography.$font-small;
		background: #f8f9fa;
		border-top: 1px solid #e5e5e5;
	}
</style>
