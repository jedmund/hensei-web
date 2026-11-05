<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import { goto } from '$app/navigation'
	import { usePartyContext } from '$lib/types/party-context'
	import type { PartyActions } from '$lib/composables/party-actions.svelte'
	import type { WikiImport } from '$lib/composables/wiki-import.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import PickPlaylistPane from '$lib/components/sidebar/PickPlaylistPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { PartyVisibility } from '$lib/types/visibility'

	/** The "see more" menu in the party header. */
	interface Props {
		actions: PartyActions
		wikiImport: WikiImport
		isNew: boolean
		authUserId?: string | undefined
		authUsername?: string | undefined
		hasCollectionLinks: boolean
		/** The viewer is a curator */
		canFeature?: boolean | undefined
		/** The viewer's role unlocks the gbf.wiki export */
		canExportWiki?: boolean | undefined
	}

	let {
		actions,
		wikiImport,
		isNew,
		authUserId,
		authUsername,
		hasCollectionLinks,
		canFeature = false,
		canExportWiki = false
	}: Props = $props()

	const ctx = usePartyContext()
	const party = $derived(ctx.getParty())
	// Only public teams can be staff picks
	const showFeature = $derived(canFeature && party.visibility === PartyVisibility.PUBLIC)
	// Logged-out viewers of someone else's team can have nothing to show
	const hasItems = $derived(
		isNew ||
			(ctx.canEdit() && hasCollectionLinks) ||
			!!party.sourceParty?.shortcode ||
			!!authUserId ||
			canExportWiki ||
			showFeature ||
			party.user?.id === authUserId
	)
</script>

{#if hasItems}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Tooltip content={m.party_see_more()}>
					<Button
						{...props}
						variant="ghost"
						size="small"
						iconOnly
						icon="ellipsis"
						aria-label={m.party_see_more()}
					/>
				</Tooltip>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content class="dropdown-menu" sideOffset={6} align="end">
				{#if isNew}
					<DropdownMenu.Item class="dropdown-menu-item" onSelect={wikiImport.start}>
						{m.party_import_wiki()}
					</DropdownMenu.Item>
				{:else}
					{#if ctx.canEdit() && hasCollectionLinks}
						<DropdownMenu.Item
							class="dropdown-menu-item"
							onSelect={actions.syncFromCollection}
							disabled={actions.loading || actions.isSyncingAll}
						>
							{actions.isSyncingAll ? m.party_syncing() : m.party_sync_collection()}
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="dropdown-menu-separator" />
					{/if}

					{#if party.sourceParty?.shortcode}
						<DropdownMenu.Item
							class="dropdown-menu-item"
							onSelect={() => goto(localizeHref(`/teams/${party.sourceParty?.shortcode}`))}
						>
							{m.party_view_original()}
						</DropdownMenu.Item>
					{/if}

					{#if authUserId}
						<DropdownMenu.Item
							class="dropdown-menu-item"
							onSelect={actions.toggleFavorite}
							disabled={actions.loading}
						>
							{party.favorited ? m.party_remove_favorite() : m.party_add_favorite()}
						</DropdownMenu.Item>
					{/if}

					{#if party.user?.id === authUserId && authUsername}
						<DropdownMenu.Item
							class="dropdown-menu-item"
							onSelect={() => {
								sidebar.openWithComponent(
									m.playlist_add_to(),
									PickPlaylistPane,
									{ partyId: party.id, username: authUsername },
									{ scrollable: false }
								)
							}}
							disabled={actions.loading}
						>
							{m.playlist_add_to()}
						</DropdownMenu.Item>
					{/if}

					{#if (authUserId || party.sourceParty?.shortcode) && (canExportWiki || showFeature)}
						<DropdownMenu.Separator class="dropdown-menu-separator" />
					{/if}
					{#if canExportWiki}
						<DropdownMenu.Item class="dropdown-menu-item" onSelect={actions.openWikiExport}>
							{m.party_export_wiki()}
						</DropdownMenu.Item>
					{/if}
					{#if showFeature}
						<DropdownMenu.Item
							class="dropdown-menu-item"
							onSelect={() => (actions.featureDialogOpen = true)}
						>
							{m.feature_team()}
						</DropdownMenu.Item>
					{/if}

					{#if party.user?.id === authUserId}
						<DropdownMenu.Separator class="dropdown-menu-separator" />
						<DropdownMenu.Item
							class="dropdown-menu-item danger"
							onSelect={() => (actions.deleteDialogOpen = true)}
							disabled={actions.loading}
						>
							{m.party_delete()}
						</DropdownMenu.Item>
					{/if}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}
