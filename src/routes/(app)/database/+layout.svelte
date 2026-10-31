<script lang="ts">
	import type { Snippet } from 'svelte'
	import { page } from '$app/state'
	import { afterNavigate } from '$app/navigation'
	import { getLocale } from '$lib/paraglide/runtime'
	import DatabaseSidebar from '$lib/components/database/DatabaseSidebar.svelte'
	import { rootOf, sectionForUrl } from '$lib/features/database/sections'
	import { recordTitle } from '$lib/features/database/breadcrumb'
	import { recentPages } from '$lib/features/database/recent.svelte'
	import type { LayoutData } from './$types'

	const { data, children }: { data: LayoutData; children: Snippet } = $props()

	// Remember record pages (detail/edit) for the overview's "Recently opened"
	afterNavigate(() => {
		const title = recordTitle(page.data as Record<string, unknown>, getLocale())
		const section = rootOf(sectionForUrl(page.url))
		if (!title || !section) return
		recentPages.record({ path: page.url.pathname, title, sectionId: section.id })
	})

	const element = $derived(
		(page.data as { currentUser?: { element?: string } | null }).currentUser?.element
	)
</script>

<div class="database-layout database-shell">
	<DatabaseSidebar role={data.role} {element} />
	<div class="database-content">
		{@render children?.()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.database-shell {
		display: flex;
		align-items: flex-start;
		gap: layout.$database-sidebar-gap;
	}

	.database-content {
		flex: 1;
		min-width: 0;

		// List toolbars keep one height whichever view's controls they hold.
		// Content-box so each page keeps its own padding.
		:global(.controls) {
			box-sizing: content-box;
			min-height: layout.$database-control-height;
		}
	}
</style>
