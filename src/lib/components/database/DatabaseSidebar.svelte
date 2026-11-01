<script lang="ts">
	// Desktop database sidebar (≥1100px). Narrower screens use the
	// section sheet opened from the top bar.
	import DatabaseSectionList from './DatabaseSectionList.svelte'

	interface Props {
		role: number
		element?: string | undefined
	}

	let { role, element }: Props = $props()
</script>

<aside class="database-sidebar">
	<DatabaseSectionList {role} {element} />
</aside>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;

	.database-sidebar {
		width: layout.$database-sidebar-width;
		flex-shrink: 0;
		position: sticky;
		top: 0; // the scroll container's top padding already clears the fixed nav
		align-self: flex-start;
		max-height: calc(100vh - #{layout.$nav-height} - var(--bahamut-offset, 0px));
		overflow-y: auto;
		padding-bottom: spacing.$unit-4x;
		scrollbar-width: thin;
	}

	@media (max-width: calc(#{layout.$database-sidebar-breakpoint} - 1px)) {
		.database-sidebar {
			display: none;
		}
	}
</style>
