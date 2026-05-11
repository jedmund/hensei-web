<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery } from '@tanstack/svelte-query'
	import { roleQueries } from '$lib/api/queries/role.queries'
	import { withInitialData } from '$lib/query/ssr'

	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'

	import { localizeHref } from '$lib/paraglide/runtime'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const roleQuery = createQuery(() => ({
		...roleQueries.byId(data.roleRecord?.id ?? ''),
		...withInitialData(data.roleRecord)
	}))

	const role = $derived(roleQuery.data)
	const editUrl = $derived(
		role?.id ? localizeHref(`/database/character-roles/${role.id}/edit`) : undefined
	)
	const pageTitle = $derived(m.page_title_db_entity({ name: role?.nameEn ?? 'Role' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.nav_roles()}>
		{#snippet leftAction()}
			<Button
				variant="ghost"
				size="small"
				leftIcon="chevron-left"
				href={localizeHref('/database/character-roles')}
			>
				{m.roles_back()}
			</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if editUrl}
				<Button variant="secondary" size="small" href={editUrl}>{m.roles_edit()}</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if role}
		<div class="content">
			<header class="entity-header">
				<RoleIcon iconKey={role.iconKey} name={role.nameEn} size={64} imageSize={48} />
				<h2>{role.nameEn}</h2>
			</header>

			<section class="details">
				<DetailsContainer title={m.roles_section_basics()}>
					<DetailItem label={m.roles_field_name_en()} value={role.nameEn} />
					<DetailItem label={m.roles_field_name_jp()} value={role.nameJp ?? '—'} />
					<DetailItem
						label={m.roles_field_sort_order()}
						value={role.sortOrder != null ? String(role.sortOrder) : '—'}
					/>
				</DetailsContainer>
			</section>
		</div>
	{:else if roleQuery.isLoading}
		<div class="loading">{m.roles_loading()}</div>
	{:else}
		<NotFoundPlaceholder
			title={m.roles_not_found_title()}
			message={m.roles_not_found_message()}
			backHref={localizeHref('/database/character-roles')}
			backLabel={m.roles_back()}
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.entity-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;

		h2 {
			margin: 0;
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
			color: var(--text-primary);
		}
	}

	.details {
		@include database.details;
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
