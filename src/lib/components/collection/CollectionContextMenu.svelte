<script lang="ts">
	import { ContextMenu } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		itemType: 'character' | 'weapon' | 'summon'
		onView: () => void
		onEdit?: () => void
		canEdit?: boolean
		isTeamsPaneOpen?: boolean
		onViewTeams: () => void
		onAddToTeamsView?: () => void
		canAccessDb?: boolean
		onViewInDatabase?: () => void
		children: Snippet
	}

	let {
		itemType,
		onView,
		onEdit,
		canEdit = false,
		isTeamsPaneOpen = false,
		onViewTeams,
		onAddToTeamsView,
		canAccessDb = false,
		onViewInDatabase,
		children
	}: Props = $props()

	const viewLabel = $derived(
		itemType === 'character'
			? m.context_view_character()
			: itemType === 'weapon'
				? m.context_view_weapon()
				: m.context_view_summon()
	)

	const editLabel = $derived(
		itemType === 'character'
			? m.context_edit_character()
			: itemType === 'weapon'
				? m.context_edit_weapon()
				: m.context_edit_summon()
	)

	const viewTeamsLabel = $derived(
		itemType === 'character'
			? m.context_view_teams_character()
			: itemType === 'weapon'
				? m.context_view_teams_weapon()
				: m.context_view_teams_summon()
	)

	const hasTeamsSection = $derived(isTeamsPaneOpen && onAddToTeamsView)
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props })}
			<div class="context-trigger" {...props}>
				{@render children()}
			</div>
		{/snippet}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content class="context-menu">
			<ContextMenu.Item class="context-menu-item" onclick={onView}>
				{viewLabel}
			</ContextMenu.Item>

			{#if canEdit && onEdit}
				<ContextMenu.Item class="context-menu-item" onclick={onEdit}>
					{editLabel}
				</ContextMenu.Item>
			{/if}

			<ContextMenu.Separator class="context-menu-separator" />

			<ContextMenu.Item class="context-menu-item" onclick={onViewTeams}>
				{viewTeamsLabel}
			</ContextMenu.Item>

			{#if hasTeamsSection}
				<ContextMenu.Item class="context-menu-item" onclick={onAddToTeamsView}>
					{m.context_add_to_teams_view()}
				</ContextMenu.Item>
			{/if}

			{#if canAccessDb && onViewInDatabase}
				<ContextMenu.Separator class="context-menu-separator" />
				<ContextMenu.Item class="context-menu-item" onclick={onViewInDatabase}>
					{m.context_view_in_database()}
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>

<style lang="scss">
	@use '../ui/menu/menu-styles.scss';

	.context-trigger {
		display: contents;
	}
</style>
