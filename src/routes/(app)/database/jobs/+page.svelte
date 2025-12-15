<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getJobIconUrl, getJobTierName } from '$lib/utils/jobUtils'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import type { Job } from '$lib/types/api/entities'

	// Fetch all jobs
	const jobsQuery = createQuery(() => jobQueries.list())

	// Search state
	let searchTerm = $state('')

	// Filter jobs based on search
	const filteredJobs = $derived.by(() => {
		const jobs = jobsQuery.data ?? []
		if (!searchTerm.trim()) return jobs

		const term = searchTerm.toLowerCase()
		return jobs.filter(
			(job) =>
				job.name.en.toLowerCase().includes(term) ||
				job.name.ja?.toLowerCase().includes(term) ||
				job.granblueId.includes(term) ||
				getJobTierName(job.row).toLowerCase().includes(term)
		)
	})

	// Row order mapping for sorting
	const rowOrder: Record<string, number> = {
		'1': 1,
		'2': 2,
		'3': 3,
		'4': 4,
		'5': 5,
		ex: 6,
		ex1: 6,
		ex2: 7
	}

	// Sort jobs - always by row first, then by order within each row
	const sortedJobs = $derived.by(() => {
		const jobs = [...filteredJobs]

		jobs.sort((a, b) => {
			// Primary sort: by row
			const rowA = rowOrder[a.row?.toString() || ''] || 99
			const rowB = rowOrder[b.row?.toString() || ''] || 99
			if (rowA !== rowB) {
				return rowA - rowB
			}

			// Secondary sort: by order within the same row
			return (a.order || 0) - (b.order || 0)
		})

		return jobs
	})

	function handleRowClick(job: Job) {
		goto(`/database/jobs/${job.granblueId}`)
	}
</script>

<PageMeta title={m.page_title_db_jobs()} description={m.page_desc_home()} />

<div class="page">
	<div class="grid-container">
		<div class="controls">
			<input type="text" placeholder="Search jobs..." bind:value={searchTerm} class="search" />
		</div>

		{#if jobsQuery.isLoading}
			<div class="loading">Loading jobs...</div>
		{:else if jobsQuery.isError}
			<div class="error">Failed to load jobs</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th class="col-image">Image</th>
							<th class="col-name">Name</th>
							<th class="col-row">Row</th>
							<th class="col-proficiency">Proficiencies</th>
							<th class="col-features">Features</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedJobs as job (job.id)}
							<tr onclick={() => handleRowClick(job)} class="clickable">
								<td class="col-image">
									<img src={getJobIconUrl(job.granblueId)} alt={job.name.en} class="job-icon" />
								</td>
								<td class="col-name">
									<div class="name-cell">
										<span class="name-en">{job.name.en}</span>
									</div>
								</td>
								<td class="col-row">
									<span class="tier-badge">{getJobTierName(job.row)}</span>
								</td>
								<td class="col-proficiency">
									<div class="proficiency-icons">
										{#if job.proficiency?.[0]}
											<ProficiencyLabel proficiency={job.proficiency[0]} size="small" />
										{/if}
										{#if job.proficiency?.[1]}
											<ProficiencyLabel proficiency={job.proficiency[1]} size="small" />
										{/if}
									</div>
								</td>
								<td class="col-features">
									<div class="features">
										{#if job.masterLevel}
											<span class="badge master">Master</span>
										{/if}
										{#if job.ultimateMastery}
											<span class="badge ultimate">Ultimate</span>
										{/if}
										{#if job.accessory}
											<span class="badge accessory">Accessory</span>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="footer">
				Showing {sortedJobs.length} of {jobsQuery.data?.length ?? 0} jobs
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
		color: colors.$grey-50;
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

	.col-image {
		width: 60px;
		padding-left: spacing.$unit-2x !important;
	}

	.col-name {
		min-width: 180px;
	}

	.col-row {
		width: 100px;
	}

	.col-proficiency {
		width: 100px;
	}

	.col-features {
		width: 200px;
	}

	.job-icon {
		width: auto;
		height: 28px;
		border-radius: 4px;
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tier-badge {
		display: inline-block;
		padding: 2px 8px;
		background: colors.$grey-90;
		border-radius: 4px;
		font-size: typography.$font-small;
		color: colors.$grey-30;
	}

	.proficiency-icons {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.features {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;

		&.master {
			background: colors.$yellow;
			color: white;
		}

		&.ultimate {
			background: colors.$dark-bg-00;
			color: white;
		}

		&.accessory {
			background: colors.$blue;
			color: white;
		}
	}

	.footer {
		padding: spacing.$unit;
		text-align: center;
		color: colors.$grey-50;
		font-size: typography.$font-small;
		background: #f8f9fa;
		border-top: 1px solid #e5e5e5;
	}
</style>
