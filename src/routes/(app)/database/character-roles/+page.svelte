<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import EntityIcon from '$lib/components/EntityIcon.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	import { roleQueries } from '$lib/api/queries/role.queries'
	import { useReorderRoles } from '$lib/api/mutations/role.mutations'
	import { useDragReorder } from '$lib/utils/dragReorder.svelte'
	import { withInitialData } from '$lib/query/ssr'
	import { localizeHref } from '$lib/paraglide/runtime'

	import type { Role } from '$lib/types/api/party'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const rolesQuery = createQuery(() => ({
		...roleQueries.all(),
		...withInitialData(data.roles)
	}))

	const reorderMut = useReorderRoles()

	const sortedRoles = $derived.by(() => {
		const list = (rolesQuery.data ?? []) as Role[]
		return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
	})

	const drag = useDragReorder<Role>({
		items: () => sortedRoles,
		onReorder: (next) => {
			reorderMut.mutate(next.map((r, i) => ({ id: r.id, sortOrder: i + 1 })))
		}
	})
</script>

<PageMeta title={m.page_title_db_roles()} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.nav_roles()}>
		{#snippet rightAction()}
			<Button variant="primary" size="small" href={localizeHref('/database/character-roles/new')}>
				{m.roles_new()}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if rolesQuery.isLoading}
		<div class="loading">{m.roles_loading()}</div>
	{:else if sortedRoles.length === 0}
		<div class="empty">{m.roles_empty()}</div>
	{:else}
		<ol class="role-list">
			{#each sortedRoles as role, index (role.id)}
				<li
					class="role-row"
					class:drop-target={drag.isDropTarget(index)}
					draggable="true"
					ondragstart={(e) => drag.onDragStart(e, index)}
					ondragover={(e) => drag.onDragOver(e, index)}
					ondragleave={drag.onDragLeave}
					ondrop={(e) => drag.onDrop(e, index)}
				>
					<a class="link" href={localizeHref(`/database/character-roles/${role.id}`)}>
						<EntityIcon iconKey={role.iconKey} name={role.nameEn} size={40} imageSize={32} />

						<span class="names">
							<span class="name-en">{role.nameEn}</span>
							{#if role.nameJp}
								<span class="name-jp">{role.nameJp}</span>
							{/if}
						</span>
					</a>

					<Button
						variant="ghost"
						size="small"
						onclick={() => goto(localizeHref(`/database/character-roles/${role.id}/edit`))}
					>
						{m.roles_edit()}
					</Button>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.role-list {
		list-style: none;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.role-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--input-bound-bg);
		border-radius: layout.$item-corner;
		cursor: grab;
		transition:
			background 0.15s ease,
			outline-color 0.15s ease;
		outline: 2px solid transparent;

		&:hover {
			background: var(--input-bound-bg-hover);
		}

		&:active {
			cursor: grabbing;
		}

		&.drop-target {
			outline-color: var(--accent-blue);
		}

		:global(button) {
			cursor: pointer;
		}
	}

	.link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		flex: 1;
		min-width: 0;
		text-decoration: none;
		color: inherit;
		cursor: inherit;
	}

	.names {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		min-width: 0;

		.name-en {
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			color: var(--text-primary);
		}

		.name-jp {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.loading,
	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
