<!-- Refresh several characters after a balance patch: pick, preview in a job, untick, apply -->
<script lang="ts">
	import { untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { useQueryClient } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
	import { BatchRefreshSession } from './refreshSession.svelte'
	import {
		characterPath,
		failureMessage,
		isSelectable,
		itemStatusLabel,
		itemSummary,
		refreshName
	} from './refresh'
	import {
		characterRefreshAdapter,
		MAX_BATCH_CHARACTERS
	} from '$lib/api/adapters/characterRefresh.adapter'

	interface Props {
		open: boolean
	}

	let { open = $bindable(false) }: Props = $props()

	const queryClient = useQueryClient()

	let session = $state<BatchRefreshSession | null>(null)
	let typeaheadValue = $state<string | null>(null)
	let typeaheadQuery = $state('')

	// A fresh session each time the dialog opens; closing stops polling (the job carries on).
	$effect(() => {
		if (open) {
			untrack(() => session?.dispose())
			session = new BatchRefreshSession(characterRefreshAdapter, {
				onApplied: (count) => {
					toast.success(m.character_refresh_batch_applied({ count }))
					queryClient.invalidateQueries({ queryKey: ['characters'] })
				}
			})
		} else {
			untrack(() => session?.dispose())
		}
	})

	const phase = $derived(session?.phase ?? 'picking')
	const picking = $derived(phase === 'picking' || phase === 'starting')

	function handlePick(option: Parameters<BatchRefreshSession['add']>[0]) {
		session?.add(option)
		// Clear the field for the next pick
		typeaheadValue = null
		typeaheadQuery = ''
	}

	const primaryAction = $derived.by(() => {
		if (!session) return undefined
		switch (phase) {
			case 'picking':
			case 'starting':
				return {
					label:
						phase === 'starting' ? m.character_refresh_previewing() : m.character_refresh_preview(),
					onclick: () => session?.start(),
					disabled: !session.canStart
				}
			case 'running':
				return { label: m.character_refresh_previewing(), onclick: () => {}, disabled: true }
			case 'previewed':
				return {
					label: m.character_refresh_batch_apply({ count: session.selected.length }),
					onclick: () => session?.apply(),
					disabled: !session.canApply
				}
			case 'applying':
				return { label: m.character_refresh_applying(), onclick: () => {}, disabled: true }
			default:
				return undefined
		}
	})
</script>

<Dialog bind:open size="small">
	<ModalHeader
		title={m.character_refresh_batch_action()}
		description={m.character_refresh_batch_description({ max: MAX_BATCH_CHARACTERS })}
	/>

	<ModalBody>
		{#if session}
			<div class="batch-body">
				{#if session.failure}
					<Notice
						variant={session.failure === 'rate_limited' || session.failure === 'not_previewed'
							? 'yellow'
							: 'red'}
					>
						<div class="notice-row">
							<span>{failureMessage(session.failure, session.failureDetail)}</span>
							{#if session.pollStopped}
								<Button variant="ghost" size="small" onclick={() => session?.resume()}>
									{m.character_refresh_try_again()}
								</Button>
							{/if}
						</div>
					</Notice>
				{/if}

				{#if picking}
					<CharacterTypeahead
						bind:value={typeaheadValue}
						bind:query={typeaheadQuery}
						placeholder={m.character_refresh_batch_search()}
						disabled={session.isFull || phase === 'starting'}
						onSelect={handlePick}
						contained
					/>
					{#if session.isFull}
						<p class="hint">{m.character_refresh_batch_limit({ max: MAX_BATCH_CHARACTERS })}</p>
					{/if}

					{#if session.picks.length === 0}
						<p class="hint">{m.character_refresh_batch_empty()}</p>
					{:else}
						<ul class="picks">
							{#each session.picks as pick (pick.id)}
								<li class="pick">
									<SearchOptionItem
										label={pick.label}
										granblueId={pick.granblueId}
										type="Character"
										element={pick.element ?? undefined}
										season={pick.season}
										series={pick.series}
										styleSwap={pick.styleSwap}
										showType={false}
										imageSize={40}
									/>
									<Button
										variant="ghost"
										size="small"
										iconOnly
										icon="close"
										aria-label={m.character_refresh_batch_remove({ name: pick.label })}
										disabled={phase === 'starting'}
										onclick={() => session?.remove(pick.id)}
									/>
								</li>
							{/each}
						</ul>
					{/if}

					<SettingsRow
						title={m.character_refresh_include_jp()}
						subtitle={m.character_refresh_include_jp_subtitle()}
						compact
					>
						{#snippet control()}
							<Switch bind:checked={session!.includeJp} disabled={phase === 'starting'} />
						{/snippet}
					</SettingsRow>
				{:else if session.batch}
					{#if phase === 'running'}
						<p class="hint">
							{m.character_refresh_batch_progress({
								done: session.progress.done,
								total: session.progress.total
							})}
						</p>
					{:else if phase === 'failed'}
						<Notice variant="red">{m.character_refresh_batch_failed()}</Notice>
					{/if}

					<ul class="items">
						{#each session.batch.items as item (item.characterId)}
							{@const name = refreshName(item.name)}
							{@const styleName = item.styleName ? refreshName(item.styleName) : null}
							{@const summary = itemSummary(item)}
							<li class="item {item.status}">
								<Checkbox
									checked={session.isSelected(item.characterId)}
									disabled={phase !== 'previewed' || !isSelectable(item)}
									onCheckedChange={(checked) => session?.toggle(item.characterId, checked)}
									size="small"
								/>
								<div class="item-text">
									<a
										class="item-name"
										href={localizeHref(characterPath(item))}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={m.character_refresh_batch_open({ name: styleName ?? name })}
									>
										{name}{#if styleName}<span class="style-name">{styleName}</span>{/if}
									</a>
									{#if summary}
										<span class="item-summary">{summary}</span>
									{/if}
								</div>
								<span class="item-status">{itemStatusLabel(item.status)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</ModalBody>

	<ModalFooter onCancel={() => (open = false)} {primaryAction} />
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.batch-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit 0;
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.notice-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.picks,
	.items {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.pick {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--input-bg);
		border-radius: layout.$item-corner;
	}

	.item-text {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		flex: 1;
		min-width: 0;
	}

	.item-name {
		color: var(--text-primary);
		font-weight: typography.$medium;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	.style-name {
		margin-left: spacing.$unit-half;
		color: var(--text-secondary);
		font-weight: typography.$normal;
	}

	.item-summary {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.item.failed .item-summary {
		color: var(--danger);
	}

	.item-status {
		flex-shrink: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
