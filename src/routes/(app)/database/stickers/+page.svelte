<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import StickerImage from '$lib/components/stickers/StickerImage.svelte'

	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import {
		useReorderStickers,
		useUpdateSticker
	} from '$lib/api/mutations/sticker-catalogue.mutations'
	import { useDragReorder } from '$lib/utils/dragReorder.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { withInitialData } from '$lib/query/ssr'
	import { localizeHref } from '$lib/paraglide/runtime'

	import type { Sticker } from '$lib/types/api/sticker'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const stickersQuery = createQuery(() => ({
		...stickerQueries.catalogue(),
		...withInitialData(data.stickers)
	}))

	const reorderMut = useReorderStickers()
	const updateMut = useUpdateSticker()

	const sorted = $derived([...(stickersQuery.data ?? [])].sort((a, b) => a.position - b.position))

	const drag = useDragReorder<Sticker>({
		items: () => sorted,
		onReorder: (next) => {
			reorderMut.mutate(
				next.map((s) => s.id),
				{ onError: (err) => toast.error(extractErrorMessage(err, m.db_stickers_reorder_failed())) }
			)
		}
	})

	function setActive(sticker: Sticker, active: boolean) {
		// Switch also calls onCheckedChange on mount; only save real changes
		if (active === sticker.active) return
		updateMut.mutate(
			{ id: sticker.id, payload: { active } },
			{ onError: (err) => toast.error(extractErrorMessage(err, m.db_stickers_save_failed())) }
		)
	}
</script>

<PageMeta title={m.page_title_db_stickers()} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.nav_stickers()}>
		{#snippet rightAction()}
			<Button variant="ghost" size="small" href={localizeHref('/database/stickers/new')}>
				{m.db_stickers_new()}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if stickersQuery.isLoading}
		<div class="loading">{m.db_stickers_loading()}</div>
	{:else if sorted.length === 0}
		<div class="empty">{m.db_stickers_empty()}</div>
	{:else}
		<ol class="sticker-list">
			{#each sorted as sticker, index (sticker.id)}
				<li
					class="sticker-row"
					class:inactive={!sticker.active}
					class:drop-target={drag.isDropTarget(index)}
					draggable="true"
					ondragstart={(e) => drag.onDragStart(e, index)}
					ondragover={(e) => drag.onDragOver(e, index)}
					ondragleave={drag.onDragLeave}
					ondrop={(e) => drag.onDrop(e, index)}
				>
					<StickerImage {sticker} size={56} />
					<span class="names">
						<span class="meaning-en">{sticker.meaning.en}</span>
						<span class="meaning-jp">{sticker.meaning.ja}</span>
						<span class="slug">{sticker.slug}</span>
					</span>
					<label class="active-toggle">
						<span>{sticker.active ? m.db_stickers_active() : m.db_stickers_inactive()}</span>
						<Switch
							checked={sticker.active}
							size="small"
							onCheckedChange={(checked) => setActive(sticker, checked)}
						/>
					</label>
					<Button
						variant="ghost"
						size="small"
						onclick={() => goto(localizeHref(`/database/stickers/${sticker.id}/edit`))}
					>
						{m.db_stickers_edit()}
					</Button>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.sticker-list {
		list-style: none;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.sticker-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		cursor: grab;
		outline: 2px solid transparent;

		&:hover {
			background: var(--input-bound-bg);
		}

		&.inactive {
			opacity: 0.6;
		}

		&.drop-target {
			outline-color: var(--accent-blue);
		}

		:global(button) {
			cursor: pointer;
		}
	}

	.names {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		flex: 1;
		min-width: 0;

		.meaning-en {
			font-weight: typography.$medium;
			color: var(--text-primary);
		}

		.meaning-jp,
		.slug {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}

		.slug {
			font-family: monospace;
			color: var(--text-tertiary);
		}
	}

	.active-toggle {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.loading,
	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
