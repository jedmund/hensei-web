<!-- Raw Data tab actions for a character: Refresh from wiki, and Re-parse stored text in the menu -->
<script lang="ts">
	import { toast } from 'svelte-sonner'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import CharacterRefreshDialog from './CharacterRefreshDialog.svelte'
	import { failureMessage, refreshName, refreshSummary } from './refresh'
	import {
		characterRefreshAdapter,
		refreshFailure
	} from '$lib/api/adapters/characterRefresh.adapter'

	interface Props {
		/** Character row id (a style row refreshes on its own) */
		characterId: string
		characterName: { en?: string | null; ja?: string | null } | null | undefined
		disabled?: boolean
		/** Refetch the page's data after a write */
		onRefreshed: () => void
	}

	let { characterId, characterName, disabled = false, onRefreshed }: Props = $props()

	let dialogOpen = $state(false)
	let isReparsing = $state(false)

	const name = $derived(refreshName(characterName))

	async function handleReparse() {
		isReparsing = true
		try {
			const { refresh } = await characterRefreshAdapter.reparse(characterId)
			toast.success(m.character_refresh_reparse_done({ summary: refreshSummary(refresh) }))
			onRefreshed()
		} catch (error) {
			const message = (error as { message?: unknown } | null)?.message
			toast.error(
				failureMessage(refreshFailure(error), typeof message === 'string' ? message : null)
			)
		} finally {
			isReparsing = false
		}
	}
</script>

<Button
	variant="secondary"
	size="small"
	onclick={() => (dialogOpen = true)}
	disabled={disabled || isReparsing}
>
	{m.character_refresh_button()}
</Button>
<DropdownMenu>
	{#snippet trigger({ props })}
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="ellipsis"
			aria-label={m.character_refresh_more_actions()}
			disabled={disabled || isReparsing}
			{...props}
		/>
	{/snippet}
	{#snippet menu()}
		<DropdownMenuBase.Item class="dropdown-menu-item" onclick={handleReparse}>
			{m.character_refresh_reparse()}
		</DropdownMenuBase.Item>
	{/snippet}
</DropdownMenu>

<CharacterRefreshDialog
	bind:open={dialogOpen}
	{characterId}
	onApplied={() => {
		toast.success(m.character_refresh_applied({ name }))
		onRefreshed()
	}}
/>
