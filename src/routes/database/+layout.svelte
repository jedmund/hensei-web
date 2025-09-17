<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import type { PageData } from './$types'

	const { data, children }: { data: PageData; children: () => any } = $props()

	const baseHref = localizeHref('/database')
	const summonsHref = localizeHref('/database/summons')
	const charactersHref = localizeHref('/database/characters')
	const weaponsHref = localizeHref('/database/weapons')

	// Function to check if a nav item is selected based on current path
	function isSelected(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
	}

	// Get user's element for styling
	const userElement = $derived((data as any)?.user?.element || 'null')
</script>

{@render children?.()}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;
</style>
