<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterDetail from '$lib/features/database/characters/CharacterDetail.svelte'
	import { getElementLabel } from '$lib/utils/element'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import { getListUrl } from '$lib/utils/listNavigation'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	function handleTabChange(tab: DetailTab) {
		const url = new URL($page.url)
		if (tab === 'info') {
			url.searchParams.delete('tab')
		} else {
			url.searchParams.set('tab', tab)
		}
		goto(url.toString(), { replaceState: true })
	}

	// Same query as the detail body (shared cache), for the header and title
	const characterQuery = createQuery(() => ({
		...entityQueries.character(data.character?.granblueId ?? ''),
		...withInitialData(data.character)
	}))

	const character = $derived(characterQuery.data)
	const canEdit = $derived((data.role || 0) >= 7)

	// Element for button styling
	const elementName = $derived(
		getElementLabel(character?.element)?.toLowerCase() as
			'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Edit URL for navigation
	const editUrl = $derived(
		character?.granblueId ? `/database/characters/${character.granblueId}/edit` : undefined
	)

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: character?.name?.en ?? 'Character' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Character">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={getListUrl('characters')}
				>Back</Button
			>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="element-ghost" element={elementName} size="small" href={editUrl}
					>Edit</Button
				>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	<CharacterDetail
		granblueId={data.character?.granblueId ?? ''}
		initialData={data.character}
		role={data.role || 0}
		tab={$page.url.searchParams.get('tab')}
		onTabChange={handleTabChange}
	/>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}
</style>
