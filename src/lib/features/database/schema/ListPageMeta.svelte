<script lang="ts">
	// A generated list's tab title, "<Label> / Database / granblue.team" unless
	// the list names its own: shared by the table and the ordered list
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import type { ListDef } from './types'

	const { list }: { list: ListDef<unknown> } = $props()
</script>

<PageMeta
	title={list.pageTitle?.() ?? m.page_title_db_entity({ name: list.label() })}
	description={m.page_desc_home()}
/>
