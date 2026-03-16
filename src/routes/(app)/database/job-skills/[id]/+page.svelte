
<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { withInitialData } from '$lib/query/ssr'

	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import SkillTypeBadge from '$lib/components/database/SkillTypeBadge.svelte'

	import { getJobSkillIcon } from '$lib/utils/images'
	import { getJobIconUrl } from '$lib/utils/jobUtils'
	import { getSkillCategoryName, getSkillCategoryColor, getSkillColorName } from '$lib/utils/jobUtils'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const skillQuery = createQuery(() => ({
		...jobQueries.skillById(data.skill?.id ?? ''),
		...withInitialData(data.skill)
	}))

	const skill = $derived(skillQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	const editUrl = $derived(skill?.id ? `/database/job-skills/${skill.id}/edit` : undefined)

	const pageTitle = $derived(
		m.page_title_db_entity({ name: skill?.name?.en ?? 'Job Skill' })
	)

	const displayName = $derived.by(() => {
		const nameObj = skill?.name
		if (!nameObj) return 'Unknown'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown'
	})

	const skillType = $derived.by(() => {
		if (!skill) return ''
		if (skill.main) return 'main'
		if (skill.sub) return 'sub'
		if (skill.emp) return 'emp'
		if (skill.base) return 'base'
		return ''
	})
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Job Skill" backHref="/database/job-skills">
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if skill}
		<div class="content">
			<header class="detail-header">
				<div class="detail-header-left">
					<div class="skill-image">
						<img src={getJobSkillIcon(skill)} alt={displayName} />
					</div>
					<div class="detail-header-info">
						<h2>{displayName}</h2>
						<div class="meta">
							{#if skillType}
								<SkillTypeBadge {skill} />
							{/if}
						</div>
					</div>
				</div>
			</header>

			<section class="details">
				<DetailsContainer title="Metadata">
					<DetailItem label="Name (EN)" value={skill.name.en} />
					<DetailItem label="Name (JP)" value={skill.name.ja ?? '—'} />
					<DetailItem label="Slug" value={skill.slug ?? '—'} />
					<DetailItem label="Image ID" value={skill.imageId ?? '—'} />
					<DetailItem label="Action ID" value={skill.actionId != null ? String(skill.actionId) : '—'} />
				</DetailsContainer>

				<DetailsContainer title="Classification">
					<DetailItem label="Skill Type">
						{#if skillType}
							<SkillTypeBadge {skill} />
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
					<DetailItem label="Color" value={getSkillColorName(skill.color ?? 0)} />
					<DetailItem label="Order" value={String(skill.order ?? 0)} />
				</DetailsContainer>

				<DetailsContainer title="Associated Job">
					<DetailItem label="Job">
						{#if skill.job}
							<a href={localizeHref(`/database/jobs/${skill.job.granblueId}`)} class="job-link">
								<img
									src={getJobIconUrl(skill.job.granblueId)}
									alt=""
									class="job-link-icon"
								/>
								{localizedName(skill.job.name)}
							</a>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
				</DetailsContainer>
			</section>
		</div>
	{:else if skillQuery.isLoading}
		<div class="loading">Loading skill...</div>
	{:else}
		<div class="not-found">
			<h2>Skill Not Found</h2>
			<p>The job skill you're looking for could not be found.</p>
			<Button variant="secondary" size="small" href={localizeHref('/database/job-skills')}>
				Back to Skills
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		overflow: visible;
		position: relative;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.detail-header-left {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.skill-image {
		flex-shrink: 0;

		img {
			width: 64px;
			height: auto;
			border-radius: layout.$item-corner;
		}
	}

	.detail-header-info {
		flex: 1;

		h2 {
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
			color: var(--text-primary);
		}

		.meta {
			display: flex;
			flex-direction: row;
			gap: spacing.$unit;
			align-items: center;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.job-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		color: var(--text-primary);
		text-decoration: none;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}

	.job-link-icon {
		width: auto;
		height: 24px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}

	.empty-value {
		color: var(--text-secondary);
	}

	.loading,
	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.detail-header {
			flex-direction: column;
		}

		.skill-image img {
			width: 48px;
		}
	}
</style>
