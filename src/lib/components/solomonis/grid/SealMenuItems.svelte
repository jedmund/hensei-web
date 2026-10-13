<script lang="ts">
	/**
	 * SealMenuItems - the Solomonis entries in a weapon or summon's context
	 * and gear menus: "Mark as sealed/unsealed", and for a sealed item a
	 * "Set priority" submenu with its rank among that type.
	 */
	import { ContextMenu, DropdownMenu } from 'bits-ui'
	import { toast } from 'svelte-sonner'
	import Icon from '$lib/components/Icon.svelte'
	import { usePartyContext } from '$lib/types/party-context'
	import { useUpdateUnsealPriority } from '$lib/api/mutations/solomonis-grid.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import * as m from '$lib/paraglide/messages'
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import {
		entryKey,
		priorityLists,
		setPriority,
		toPriorityPayload,
		type SealItemType,
		type SlotSeal
	} from './seal'
	import { writeSealState } from './sealActions'

	interface Props {
		variant: 'context' | 'dropdown'
		type: SealItemType
		item: GridWeapon | GridSummon
		seal: SlotSeal
	}

	let { variant, type, item, seal }: Props = $props()

	const ctx = usePartyContext()
	const mutation = useUpdateUnsealPriority()

	const Item = $derived(variant === 'context' ? ContextMenu.Item : DropdownMenu.Item)
	const Sub = $derived(variant === 'context' ? ContextMenu.Sub : DropdownMenu.Sub)
	const SubTrigger = $derived(
		variant === 'context' ? ContextMenu.SubTrigger : DropdownMenu.SubTrigger
	)
	const SubContent = $derived(
		variant === 'context' ? ContextMenu.SubContent : DropdownMenu.SubContent
	)
	const itemClass = $derived(variant === 'context' ? 'context-menu-item' : 'dropdown-menu-item')
	const contentClass = $derived(variant === 'context' ? 'context-menu' : 'dropdown-menu')

	const key = $derived(entryKey({ type, id: item.id }))

	// Ranks this item can take: its current list, plus one more place when
	// it isn't ranked yet
	const ranks = $derived.by(() => {
		const ranked = priorityLists(ctx.getParty())[type].ranked
		const isRanked = ranked.some((e) => entryKey(e) === key)
		return Array.from({ length: ranked.length + (isRanked ? 0 : 1) }, (_, i) => i + 1)
	})

	function setRank(rank: number | null) {
		if (rank === seal.priority) return
		const party = ctx.getParty()
		const items = toPriorityPayload(setPriority(priorityLists(party), type, key, rank))
		mutation.mutate(
			{ partyId: party.id, partyShortcode: party.shortcode, items },
			{
				onError: (err) =>
					toast.error(extractErrorMessage(err, m.solomonis_web_grid_priority_save_failed()))
			}
		)
	}
</script>

{#if seal.state !== 'sealed'}
	<Item class={itemClass} onclick={() => writeSealState(ctx, type, item, 'sealed')}>
		{m.solomonis_web_grid_mark_sealed()}
	</Item>
{/if}
{#if seal.state !== 'unsealed'}
	<Item class={itemClass} onclick={() => writeSealState(ctx, type, item, 'unsealed')}>
		{m.solomonis_web_grid_mark_unsealed()}
	</Item>
{/if}

{#if seal.state === 'sealed'}
	<Sub>
		<SubTrigger class="{itemClass} seal-submenu-trigger">
			<span class="label">{m.solomonis_web_grid_set_priority()}</span>
			{#if seal.priority != null}
				<span class="current">{seal.priority}</span>
			{/if}
			<Icon name="chevron-right-small" size={14} />
		</SubTrigger>
		<SubContent class="{contentClass} seal-priority-menu" sideOffset={4}>
			{#each ranks as rank (rank)}
				<Item class="{itemClass} seal-priority-item" onclick={() => setRank(rank)}>
					<span class="label">{rank}</span>
					{#if seal.priority === rank}
						<Icon name="check" size={14} />
					{/if}
				</Item>
			{/each}
			<Item class="{itemClass} seal-priority-item" onclick={() => setRank(null)}>
				<span class="label">{m.solomonis_web_grid_priority_clear()}</span>
				{#if seal.priority == null}
					<Icon name="check" size={14} />
				{/if}
			</Item>
		</SubContent>
	</Sub>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;

	:global(.seal-submenu-trigger .label),
	:global(.seal-priority-item .label) {
		flex: 1;
	}

	:global(.seal-submenu-trigger .current) {
		color: var(--text-secondary);
	}

	:global(.seal-priority-menu) {
		min-width: calc($unit * 16);
	}
</style>
