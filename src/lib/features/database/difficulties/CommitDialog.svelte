<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { getAvatarSrc } from '$lib/utils/avatar'
	import { difficultyAdapter, type DifficultyDiff } from '$lib/api/adapters/difficulty.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		open?: boolean
		diff: DifficultyDiff | null
		onCommitted?: () => void
	}

	let { open = $bindable(false), diff, onCommitted }: Props = $props()

	let note = $state('')
	const queryClient = useQueryClient()

	const commitMut = createMutation(() => ({
		mutationFn: (n: string) => difficultyAdapter.commitDrafts(n)
	}))

	$effect(() => {
		if (open) note = ''
	})

	const totalChanges = $derived.by(() => {
		if (!diff) return 0
		return (
			diff.tiers.creates.length +
			diff.tiers.updates.length +
			diff.tiers.destroys.length +
			diff.rules.creates.length +
			diff.rules.updates.length +
			diff.rules.destroys.length +
			diff.components.creates.length +
			diff.components.updates.length +
			diff.components.destroys.length
		)
	})

	const sections = $derived.by(() => {
		if (!diff) return []
		return [
			{ key: 'tiers', label: 'Tiers', data: diff.tiers },
			{ key: 'rules', label: 'Rules', data: diff.rules },
			{ key: 'components', label: 'Components', data: diff.components }
		].filter((s) => s.data.creates.length + s.data.updates.length + s.data.destroys.length > 0)
	})

	async function handleSubmit() {
		try {
			await commitMut.mutateAsync(note.trim())
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success('Changes committed')
			open = false
			onCommitted?.()
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Commit failed'))
		}
	}

	function summarizeAttributes(attrs: Record<string, unknown>): string {
		const entries = Object.entries(attrs).slice(0, 4)
		return entries.map(([k, v]) => `${k}: ${stringify(v)}`).join(', ')
	}

	function stringify(value: unknown): string {
		if (value == null) return '—'
		if (typeof value === 'object') return JSON.stringify(value)
		return String(value)
	}

	const avatarSrc = $derived(getAvatarSrc(authStore.user?.avatarUrl))
</script>

<Dialog bind:open size="small">
	<ModalHeader
		title="Commit difficulty changes"
		description={totalChanges === 1
			? '1 change will go live for everyone.'
			: `${totalChanges} changes will go live for everyone.`}
	/>

	<div class="commit-body">
		<div class="author">
			<img class="avatar" src={avatarSrc} alt="" />
			<span class="username">{authStore.user?.username ?? 'You'}</span>
		</div>

		{#if sections.length === 0}
			<p class="empty">No pending changes.</p>
		{/if}

		{#each sections as section (section.key)}
			<details class="section" open>
				<summary>
					<span class="section-label">{section.label}</span>
					<span class="section-count">
						{section.data.creates.length +
							section.data.updates.length +
							section.data.destroys.length}
					</span>
				</summary>
				<ul class="entries">
					{#each section.data.creates as entry (entry.draftId)}
						<li class="entry create">
							<span class="entry-op">New</span>
							<span class="entry-label">{summarizeAttributes(entry.attributes)}</span>
						</li>
					{/each}
					{#each section.data.updates as entry (entry.draftId)}
						<li class="entry update">
							<span class="entry-op">Edit</span>
							<div class="entry-detail">
								<span class="entry-label">{entry.label}</span>
								<ul class="changes">
									{#each Object.entries(entry.changes) as [field, change] (field)}
										<li>
											<span class="field-name">{field}</span>
											<span class="from">{stringify(change.old)}</span>
											<span class="arrow">→</span>
											<span class="to">{stringify(change.new)}</span>
										</li>
									{/each}
								</ul>
							</div>
						</li>
					{/each}
					{#each section.data.destroys as entry (entry.draftId)}
						<li class="entry destroy">
							<span class="entry-op">Delete</span>
							<span class="entry-label">{entry.label}</span>
						</li>
					{/each}
				</ul>
			</details>
		{/each}

		<label class="note-label">
			<span>Note (optional)</span>
			<textarea
				bind:value={note}
				rows="3"
				placeholder="What's the intent of this change?"
				class="note-input"
			></textarea>
		</label>
	</div>

	<ModalFooter
		onCancel={() => (open = false)}
		primaryAction={{
			label: commitMut.isPending ? 'Committing…' : 'Commit',
			onclick: handleSubmit,
			disabled: commitMut.isPending || totalChanges === 0
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.commit-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		max-height: 60vh;
		overflow-y: auto;
	}

	.author {
		display: flex;
		align-items: center;
		gap: spacing.$unit;

		.avatar {
			width: spacing.$unit-4x;
			height: spacing.$unit-4x;
			border-radius: 50%;
			background: var(--input-bg);
		}

		.username {
			color: var(--text-primary);
			font-weight: typography.$medium;
		}
	}

	.empty {
		color: var(--text-secondary);
		margin: 0;
	}

	.section {
		border: 1px solid var(--border-subtle);
		border-radius: layout.$item-corner;
		padding: spacing.$unit;

		summary {
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;
			padding: spacing.$unit-half spacing.$unit;
			list-style: none;

			&::-webkit-details-marker {
				display: none;
			}
		}

		.section-label {
			font-weight: typography.$bold;
			color: var(--text-primary);
		}

		.section-count {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
		}
	}

	.entries {
		list-style: none;
		padding: 0;
		margin: spacing.$unit 0 0 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.entry {
		display: flex;
		align-items: flex-start;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--input-bg);
		border-radius: layout.$item-corner;

		.entry-op {
			padding: spacing.$unit-fourth spacing.$unit;
			border-radius: layout.$full-corner;
			font-size: typography.$font-tiny;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			background: var(--accent-yellow, var(--card-bg));
			color: var(--text-primary);
			flex-shrink: 0;
		}

		&.create .entry-op {
			background: var(--accent-green, var(--input-bg));
		}

		&.destroy .entry-op {
			background: var(--danger-bg-subtle);
			color: var(--danger);
		}

		.entry-detail {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-half;
			min-width: 0;
		}

		.entry-label {
			color: var(--text-primary);
			font-weight: typography.$medium;
		}
	}

	.changes {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;

		li {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: spacing.$unit-half;
			font-size: typography.$font-small;
			color: var(--text-secondary);

			.field-name {
				color: var(--text-tertiary);
				font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			}

			.from {
				color: var(--text-tertiary);
				text-decoration: line-through;
			}

			.arrow {
				color: var(--text-tertiary);
			}

			.to {
				color: var(--text-primary);
				font-weight: typography.$medium;
			}
		}
	}

	.note-label {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.note-input {
		padding: spacing.$unit;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$input-corner;
		background: var(--input-bg);
		color: var(--text-primary);
		font: inherit;
		resize: vertical;

		&:focus {
			outline: 2px solid var(--focus-ring);
			outline-offset: -1px;
			border-color: transparent;
		}
	}
</style>
