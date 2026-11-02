<script lang="ts">
	// The weapon skill families list, which leads into weapon-skill curation
	// (`/database/weapon-skills/<modifier>`). All families come in one request,
	// so the table searches, filters and sorts on the client.
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createStaticSource } from '$lib/components/data-table/staticSource.svelte'
	import { filterSpecs } from '$lib/components/data-table/filters'
	import { weaponSkillAdapter } from '$lib/api/adapters/weaponSkill.adapter'
	import { familyColumns, familyFilterFns, familyFilters, familyHref } from './families'

	const familiesQuery = createQuery(() => ({
		// Shared with the family page, which invalidates it after edits
		queryKey: ['weaponSkillFamilies'],
		queryFn: () => weaponSkillAdapter.getWeaponSkillFamilies()
	}))

	const families = $derived(familiesQuery.data ?? [])
	const filters = familyFilters(() => families)

	const url = createTableUrl({
		filters: filterSpecs(filters),
		defaultSort: [{ id: 'name', desc: false }]
	})

	const source = createStaticSource({
		url,
		columns: familyColumns,
		data: () => familiesQuery.data,
		isPending: () => familiesQuery.isPending,
		isFetching: () => familiesQuery.isFetching,
		error: () => familiesQuery.error,
		refetch: () => familiesQuery.refetch(),
		filters: familyFilterFns
	})

	const editedCount = $derived(families.filter((f) => f.manuallyEdited).length)
</script>

<PageMeta
	title={m.page_title_db_entity({ name: m.db_weapon_skills_label() })}
	description={m.page_desc_home()}
/>

<div class="database-page">
	{#if editedCount > 0}
		<!-- Curation edits live only in the database until they're exported -->
		<p class="export-reminder">
			{m.db_weapon_skills_export_reminder({ count: editedCount })}
			<code>rake granblue:export_weapon_skill_data</code> /
			<code>granblue:export_weapon_skill_effects</code>
		</p>
	{/if}
	<DataTable
		columns={familyColumns}
		{source}
		{filters}
		rowId={(f) => f.modifier}
		rowHref={familyHref}
		rowTitle={(f) => f.displayName?.en ?? f.modifier}
		storageKey="weapon-skills"
		rowHeight="image"
		pinFirstColumn
		searchEntity={m.db_weapon_skills_entity()}
		label={m.db_weapon_skills_label()}
		emptyMessage={m.db_weapon_skills_empty()}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		margin: 0 auto;
	}

	.export-reminder {
		margin: 0 0 spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--notice-yellow-bg, rgba(224, 138, 0, 0.1));
		color: var(--text-secondary);
		font-size: typography.$font-small;
		border-radius: spacing.$unit-half;

		code {
			font-size: typography.$font-tiny;
		}
	}
</style>
