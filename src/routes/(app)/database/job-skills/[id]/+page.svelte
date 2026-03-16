
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { withInitialData } from '$lib/query/ssr'

	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailEntityHeader from '$lib/components/database/DetailEntityHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import SkillTypeBadge from '$lib/components/database/SkillTypeBadge.svelte'
	import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'

	import { getJobSkillIcon } from '$lib/utils/images'
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
	<DatabasePageHeader title="Job Skill">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/job-skills">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if skill}
		<div class="content">
			<DetailEntityHeader imageUrl={getJobSkillIcon(skill)} name={displayName}>
				{#snippet meta()}
					{#if skillType}
						<SkillTypeBadge {skill} />
					{/if}
				{/snippet}
			</DetailEntityHeader>

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
							<AssociatedEntityLink type="job" entity={skill.job} />
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
		<NotFoundPlaceholder
			title="Skill Not Found"
			message="The job skill you're looking for could not be found."
			backHref={localizeHref('/database/job-skills')}
			backLabel="Back to Skills"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		overflow: visible;
		position: relative;
	}

	.details {
		@include database.details;
	}


	.empty-value {
		color: var(--text-secondary);
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
