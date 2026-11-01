<script lang="ts">
	// The characters list: the generated list with the batch refresh action for editors
	import { page } from '$app/state'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { EDITOR_ROLE } from '$lib/auth/roles'
	import BatchRefreshDialog from '$lib/features/database/characters/refresh/BatchRefreshDialog.svelte'
	import ResourceTable from '$lib/features/database/schema/ResourceTable.svelte'

	// The database is editor-only already; checked again so the action never shows otherwise
	const canEdit = $derived(((page.data.role as number | undefined) ?? 0) >= EDITOR_ROLE)
	let batchRefreshOpen = $state(false)
</script>

<PageMeta title={m.page_title_db_characters()} description={m.page_desc_home()} />

{#snippet actions()}
	{#if canEdit}
		<DropdownMenu>
			{#snippet trigger({ props })}
				<Button
					variant="ghost"
					size="small"
					iconOnly
					icon="ellipsis"
					aria-label={m.character_refresh_more_actions()}
					{...props}
				/>
			{/snippet}
			{#snippet menu()}
				<DropdownMenuBase.Item class="dropdown-menu-item" onclick={() => (batchRefreshOpen = true)}>
					{m.character_refresh_batch_action()}
				</DropdownMenuBase.Item>
			{/snippet}
		</DropdownMenu>
	{/if}
{/snippet}

{#if canEdit}
	<BatchRefreshDialog bind:open={batchRefreshOpen} />
{/if}

<div class="database-page">
	<ResourceTable resource="characters" toolbarEnd={actions} />
</div>

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>
