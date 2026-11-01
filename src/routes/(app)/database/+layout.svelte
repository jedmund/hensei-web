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

<div class="database-layout database-shell element-{element ?? 'null'}">
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

	// The user's element, for accents inside the database (e.g. the open row's bar)
	@each $el in null, wind, fire, water, earth, dark, light {
		.element-#{$el} {
			--database-accent: var(--#{$el}-button-bg);
		}
	}

	.database-content {
		flex: 1;
		min-width: 0;

		// List toolbars and the record panel's header keep one height whichever
		// controls they hold. Content-box so each keeps its own padding.
		:global(:is(.controls, .data-table > .toolbar, .panel-header)) {
			box-sizing: content-box;
			min-height: layout.$database-control-height;
		}
	}
</style>
