<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { PageData } from './$types'

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { data, children }: { data: PageData; children: Snippet } = $props()
</script>

{@render children?.()}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;
</style>
