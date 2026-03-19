
<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { createQuery } from '@tanstack/svelte-query'
	import { bulletQueries } from '$lib/api/queries/bullet.queries'
	import { withInitialData } from '$lib/query/ssr'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const bulletQuery = createQuery(() => ({
		...bulletQueries.byId(data.bullet?.granblueId ?? data.bullet?.id ?? ''),
		...withInitialData(data.bullet)
	}))

	const bullet = $derived(bulletQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	const editUrl = $derived(
		bullet?.granblueId
			? `/database/bullets/${bullet.granblueId}/edit`
			: bullet?.id
				? `/database/bullets/${bullet.id}/edit`
				: undefined
	)

	const pageTitle = $derived(
		m.page_title_db_entity({ name: bullet?.name?.en ?? 'Bullet' })
	)
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Bullet">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/bullets">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if bullet}
		<section class="details">
			<DetailsContainer title="Metadata">
				<DetailItem label="Name (EN)" value={bullet.name.en} />
				<DetailItem label="Name (JP)" value={bullet.name.ja ?? '—'} />
				<DetailItem label="Granblue ID" value={bullet.granblueId ?? '—'} />
				<DetailItem label="Slug" value={bullet.slug} />
			</DetailsContainer>

			<DetailsContainer title="Properties">
				<DetailItem label="Bullet Type">
					<span class="type-badge" class:parabellum={bullet.bulletType === 1} class:rifle={bullet.bulletType === 2} class:cartridge={bullet.bulletType === 3} class:aetherial={bullet.bulletType === 4}>
						{BULLET_TYPES[bullet.bulletType] ?? 'Unknown'}
					</span>
				</DetailItem>
				<DetailItem label="ATK" value={String(bullet.atk ?? 0)} />
				<DetailItem label="Hits All" value={bullet.hitsAll ? 'Yes' : 'No'} />
				<DetailItem label="Order" value={String(bullet.order ?? 0)} />
			</DetailsContainer>

			<DetailsContainer title="Effect">
				<DetailItem label="Effect (EN)" value={bullet.effect?.en ?? '—'} />
				<DetailItem label="Effect (JP)" value={bullet.effect?.ja ?? '—'} />
			</DetailsContainer>
		</section>
	{:else if bulletQuery.isLoading}
		<div class="loading">Loading bullet...</div>
	{:else}
		<NotFoundPlaceholder
			title="Bullet Not Found"
			message="The bullet you're looking for could not be found."
			backHref={localizeHref('/database/bullets')}
			backLabel="Back to Bullets"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.parabellum {
			background: color-mix(in srgb, var(--fire-button-bg) 20%, transparent);
			color: var(--fire-text);
		}

		&.rifle {
			background: color-mix(in srgb, var(--wind-button-bg) 20%, transparent);
			color: var(--wind-text);
		}

		&.cartridge {
			background: color-mix(in srgb, var(--earth-button-bg) 20%, transparent);
			color: var(--earth-text);
		}

		&.aetherial {
			background: color-mix(in srgb, var(--water-button-bg) 20%, transparent);
			color: var(--water-text);
		}
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
