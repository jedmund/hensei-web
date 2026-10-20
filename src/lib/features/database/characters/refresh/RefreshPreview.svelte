<!-- What a character refresh would change: wikitext, counts, skills by kind, icon fallbacks -->
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Notice from '$lib/components/ui/Notice.svelte'
	import type { CharacterRefreshResult } from '$lib/api/adapters/characterRefresh.adapter'
	import {
		changeLabel,
		entryLabels,
		countRows,
		fieldLabels,
		groupChanges,
		groupIconFallbacks,
		refreshOutcome,
		wikiState,
		wikiStateLabel
	} from './refresh'

	interface Props {
		result: CharacterRefreshResult
	}

	let { result }: Props = $props()

	const outcome = $derived(refreshOutcome(result))
	const wiki = $derived([
		{ key: 'en', label: m.character_refresh_wiki_en(), state: wikiState(result.wikiChanged) },
		{ key: 'jp', label: m.character_refresh_wiki_jp(), state: wikiState(result.wikiJpChanged) }
	])
	const counts = $derived(countRows(result.counts))
	const groups = $derived(groupChanges(result.changes))
	const fallbacks = $derived(groupIconFallbacks(result.iconFallbacks))
</script>

<div class="refresh-preview">
	<dl class="wiki-states">
		{#each wiki as row (row.key)}
			<div class="wiki-state">
				<dt>{row.label}</dt>
				<dd class={row.state}>{wikiStateLabel(row.state)}</dd>
			</div>
		{/each}
	</dl>

	{#if outcome === 'none'}
		<p class="outcome">{m.character_refresh_no_changes()}</p>
	{:else if outcome === 'text_only'}
		<p class="outcome">{m.character_refresh_text_only()}</p>
	{/if}

	{#if counts.length > 0}
		<dl class="counts">
			{#each counts as row (row.key)}
				<div class="count">
					<dt>{row.label}</dt>
					<dd>{row.parts.join(', ')}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#each groups as group (group.kind)}
		{@const labels = entryLabels(group.items)}
		<section class="group">
			<h4>{group.label}</h4>
			<ul class="changes">
				{#each group.items as change, i (`${change.position}-${change.ordinal}`)}
					<li class="change {change.change}">
						<span class="change-op">{changeLabel(change.change)}</span>
						<div class="change-detail">
							<span class="change-name">{labels[i]}</span>
							{#if change.change === 'updated' && change.fields.length > 0}
								<span class="change-fields">{fieldLabels(change.fields).join(', ')}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	{#if fallbacks.length > 0}
		<Notice variant="yellow">
			<div class="fallbacks">
				<strong>{m.character_refresh_icon_fallbacks_title()}</strong>
				<p>{m.character_refresh_icon_fallbacks_note()}</p>
				<ul>
					{#each fallbacks as group (group.kind)}
						{@const labels = entryLabels(group.items)}
						{#each group.items as fallback, i (`${group.kind}-${fallback.position}-${fallback.ordinal}`)}
							<li>{group.label}: {labels[i]}</li>
						{/each}
					{/each}
				</ul>
			</div>
		</Notice>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.refresh-preview {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.wiki-state,
	.count {
		display: flex;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		font-size: typography.$font-small;

		dt {
			color: var(--text-secondary);
		}

		dd {
			margin: 0;
			color: var(--text-primary);
			text-align: right;
		}
	}

	.wiki-state dd.changed {
		font-weight: typography.$bold;
	}

	.wiki-state dd.not_fetched {
		color: var(--text-tertiary);
	}

	.outcome {
		margin: 0;
		color: var(--text-secondary);
	}

	.group h4 {
		margin: 0 0 spacing.$unit 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.changes {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	// Same entry look as the difficulty CommitDialog
	.change {
		display: flex;
		align-items: flex-start;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--input-bg);
		border-radius: layout.$item-corner;

		.change-op {
			padding: spacing.$unit-fourth spacing.$unit;
			border-radius: layout.$full-corner;
			font-size: typography.$font-tiny;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			background: var(--accent-yellow, var(--card-bg));
			color: var(--text-primary);
			flex-shrink: 0;
		}

		&.created .change-op {
			background: var(--accent-green, var(--input-bg));
		}

		&.deleted .change-op {
			background: var(--danger-bg-subtle);
			color: var(--danger);
		}
	}

	.change-detail {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		min-width: 0;
	}

	.change-name {
		color: var(--text-primary);
		font-weight: typography.$medium;
	}

	.change-fields {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.fallbacks {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		p {
			margin: 0;
		}

		ul {
			margin: 0;
			padding-left: spacing.$unit-2x;
		}
	}
</style>
