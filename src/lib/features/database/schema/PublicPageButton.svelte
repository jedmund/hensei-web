<script lang="ts">
	// Links a record to its page on the site (RecordDef.publicPage), for the
	// detail page's and the panel's headers. Reads the record from the query
	// the detail already runs, so it adds no request. Nothing for resources
	// without a public page.
	import { createQuery } from '@tanstack/svelte-query'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '$lib/components/ui/Button.svelte'
	import type { AnyResourceDef } from './registry'

	interface Props {
		def: AnyResourceDef | undefined
		/** The record's route id (what `record.fetch` takes) */
		routeId: string | null
	}

	let { def, routeId }: Props = $props()

	const publicPage = $derived(def?.record?.publicPage)

	// Only resources with a public page run the record's query
	const query = createQuery(() =>
		def?.record && publicPage && routeId
			? def.record.query(routeId)
			: { queryKey: ['public-page', 'none'], queryFn: () => null, enabled: false }
	)

	const href = $derived(publicPage && query.data ? publicPage.href(query.data) : null)
</script>

{#if publicPage && href}
	<Button variant="ghost" size="small" rightIcon="link" href={localizeHref(href)}>
		{publicPage.label()}
	</Button>
{/if}
