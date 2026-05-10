<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Icon from '$lib/components/Icon.svelte'

	import { roleQueries } from '$lib/api/queries/role.queries'
	import { useReorderRoles } from '$lib/api/mutations/role.mutations'
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

	type SlotType = 'Character' | 'Weapon' | 'Summon'
	let slotType = $state<SlotType>('Character')

	const filteredRoles = $derived.by(() => {
		const list = (rolesQuery.data ?? []) as Role[]
		return list
			.filter((r) => r.slotType === slotType)
			.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
	})

	let dragIndex = $state<number | null>(null)
	let hoverIndex = $state<number | null>(null)

	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('text/plain', String(index))
		}
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault()
		hoverIndex = index
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
	}

	function onDragLeave() {
		hoverIndex = null
	}

	function onDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault()
		const from = dragIndex
		dragIndex = null
		hoverIndex = null
		if (from === null || from === dropIndex) return

		const next = [...filteredRoles]
		const [moved] = next.splice(from, 1)
		if (!moved) return
		next.splice(dropIndex, 0, moved)

		const entries = next.map((r, i) => ({ id: r.id, sortOrder: i + 1 }))
		reorderMut.mutate(entries)
	}

	function newRoleHref(): string {
		return localizeHref(`/database/roles/new?slot_type=${slotType}`)
	}
</script>

<PageMeta title={m.page_title_db_roles()} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.nav_roles()}>
		{#snippet rightAction()}
			<Button variant="primary" size="small" href={newRoleHref()}>
				{m.roles_new()}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	<div class="filters">
		<SegmentedControl bind:value={slotType} size="xsmall" variant="background">
			<Segment value="Character">{m.roles_type_character()}</Segment>
			<Segment value="Weapon">{m.roles_type_weapon()}</Segment>
			<Segment value="Summon">{m.roles_type_summon()}</Segment>
		</SegmentedControl>
	</div>

	{#if rolesQuery.isLoading}
		<div class="loading">{m.roles_loading()}</div>
	{:else if filteredRoles.length === 0}
		<div class="empty">{m.roles_empty()}</div>
	{:else}
		<ol class="role-list">
			{#each filteredRoles as role, index (role.id)}
				<li
					class="role-row"
					class:drop-target={hoverIndex === index && dragIndex !== null && dragIndex !== index}
					draggable="true"
					ondragstart={(e) => onDragStart(e, index)}
					ondragover={(e) => onDragOver(e, index)}
					ondragleave={onDragLeave}
					ondrop={(e) => onDrop(e, index)}
				>
					<span class="handle" aria-hidden="true">
						<Icon name="grip-vertical" width={4} height={18} />
					</span>

					<a class="link" href={localizeHref(`/database/roles/${role.id}`)}>
						<RoleIcon iconKey={role.iconKey} name={role.nameEn} size={32} />

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
						onclick={() => goto(localizeHref(`/database/roles/${role.id}/edit`))}
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

	.filters {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
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
		transition:
			background 0.15s ease,
			outline-color 0.15s ease;
		outline: 2px solid transparent;

		&:hover {
			background: var(--input-bound-bg-hover);
		}

		&.drop-target {
			outline-color: var(--accent-blue);
		}
	}

	.handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		cursor: grab;

		&:active {
			cursor: grabbing;
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
