<script lang="ts">
	import { onMount } from 'svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import {
		difficultyAdapter,
		type DifficultyPreviewResult
	} from '$lib/api/adapters/difficulty.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		initialShortcode?: string
	}

	let { initialShortcode }: Props = $props()

	let shortcode = $state(initialShortcode ?? '')
	let result = $state<DifficultyPreviewResult | null>(null)
	let error = $state<string | null>(null)
	let loading = $state(false)

	onMount(() => {
		if (initialShortcode && initialShortcode.trim()) runPreview()
	})

	async function runPreview() {
		const code = shortcode.trim()
		if (!code) return
		error = null
		loading = true
		result = null
		try {
			result = await difficultyAdapter.preview(code)
		} catch (err) {
			error = extractErrorMessage(err, 'Preview failed')
		} finally {
			loading = false
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !loading && shortcode.trim()) runPreview()
	}

	type FiredEntry = {
		id: string
		name: string
		ruleType: string
		weight: number
		matchCount: number
		kind: 'base' | 'additional'
	}

	const breakdownComponents = $derived.by(() => {
		if (!result?.breakdown) return []
		const components = (result.breakdown as { components?: unknown[] }).components ?? []
		return components as Array<{
			name: string
			weight: number
			present: boolean
			rawScore: number | null
			weightedScore: number | null
			contributionSum: number | null
			maxWeight: number | null
			targetMax: number | null
			fired: FiredEntry[]
		}>
	})

	function fmt(value: number | null | undefined, digits = 1): string {
		if (value == null) return '—'
		return value.toFixed(digits)
	}

	function labelFor(f: FiredEntry): string {
		if (f.kind !== 'additional') return f.name
		const noun = f.matchCount === 1 ? 'match' : 'matches'
		return `+${f.matchCount} additional ${noun}`
	}
</script>

<div class="preview-panel">
	<div class="input-row">
		<div class="input-wrapper">
			<Input
				bind:value={shortcode}
				placeholder="Party shortcode (e.g. qRf1iR)"
				variant="contained"
				size="medium"
				fullWidth
				onkeydown={handleKey}
			/>
		</div>
		<Button
			variant="primary"
			size="medium"
			onclick={runPreview}
			disabled={loading || !shortcode.trim()}
		>
			{loading ? 'Running…' : 'Run preview'}
		</Button>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if result}
		{#if !result.scoreable}
			<div class="notice">
				This party isn't scoreable yet — it hasn't met the minimum item threshold on every enabled
				component.
			</div>
		{:else}
			<div class="result-summary">
				<div class="result-headline">
					<span class="tier-swatch" style:background={result.tier?.color || 'var(--input-bg)'}
					></span>
					<div class="result-text">
						<span class="result-tier">{result.tier?.name ?? 'Unassigned'}</span>
						<span class="result-score">{result.score?.toFixed(2) ?? '—'} / 100</span>
					</div>
				</div>
				<span class="result-version">Ruleset v{result.rulesetVersion}</span>
			</div>

			{#if breakdownComponents.length > 0}
				<div class="breakdown">
					<h4>Component breakdown</h4>
					<ul>
						{#each breakdownComponents as c (c.name)}
							<li class="breakdown-row" class:absent={!c.present}>
								<div class="breakdown-head">
									<span class="breakdown-name">{c.name}</span>
									<span class="breakdown-score">
										{#if c.present}
											{((c.rawScore ?? 0) * 100).toFixed(0)}%
										{:else}
											No data
										{/if}
									</span>
								</div>
								{#if c.present && c.contributionSum != null && c.maxWeight != null}
									<p class="breakdown-math">
										{fmt(c.contributionSum)} / {fmt(c.maxWeight)}
										{#if c.targetMax != null}
											<span class="target-tag">target max</span>
										{/if}
									</p>
								{/if}
								{#if c.fired.length > 0}
									<ul class="fired-list">
										{#each c.fired as f (f.id)}
											<li class="fired-row" class:additional={f.kind === 'additional'}>
												<span class="fired-name">{labelFor(f)}</span>
												<span class="fired-weight">+{f.weight}</span>
											</li>
										{/each}
									</ul>
								{:else if c.present}
									<p class="no-fires">No rules fired.</p>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.preview-panel {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.hint {
		margin: 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.input-row {
		display: flex;
		gap: spacing.$unit;
		align-items: center;

		.input-wrapper {
			flex: 1;
		}
	}

	.error-banner {
		padding: spacing.$unit-2x;
		background: var(--danger-bg-subtle);
		color: var(--danger);
		border-radius: layout.$item-corner;
		font-size: typography.$font-small;
	}

	.notice {
		padding: spacing.$unit-2x;
		background: var(--input-bg);
		color: var(--text-secondary);
		border-radius: layout.$item-corner;
		font-size: typography.$font-small;
	}

	.result-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		background: var(--input-bg);
		border-radius: layout.$item-corner;
	}

	.result-headline {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.tier-swatch {
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		border-radius: 50%;
		border: 1px solid var(--border-subtle);
	}

	.result-text {
		display: flex;
		flex-direction: column;
	}

	.result-tier {
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.result-score {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.result-version {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.breakdown {
		display: flex;
		flex-direction: column;
		margin: 0 -#{spacing.$unit-2x};

		h4 {
			margin: 0;
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			color: var(--text-secondary);
			padding: spacing.$unit spacing.$unit-2x;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;

			&.fired-list {
				gap: spacing.$unit-half;
			}
		}
	}

	.breakdown-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-3x spacing.$unit-2x spacing.$unit-3x;
		border-bottom: 1px solid var(--border-subtle);

		&:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}

		&.absent {
			opacity: 0.6;
		}
	}

	.breakdown-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.breakdown-name {
		text-transform: capitalize;
		color: var(--text-primary);
		font-weight: typography.$medium;
		font-size: typography.$font-medium;
	}

	.breakdown-score {
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		font-size: typography.$font-regular;
	}

	.breakdown-math {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.target-tag {
		font-size: typography.$font-tiny;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: spacing.$unit-fourth spacing.$unit-half;
		background: var(--input-bg);
		color: var(--text-secondary);
		border-radius: layout.$item-corner-small;
	}

	.fired-list {
		display: flex;
		flex-direction: column;
	}

	.fired-row {
		display: flex;
		justify-content: space-between;
		font-size: typography.$font-regular;
		color: var(--text-secondary);
		padding: spacing.$unit spacing.$unit;
		margin: 0 calc(-1 * #{spacing.$unit});
		border-radius: layout.$item-corner;
		transition: background-color 120ms ease;

		&:hover {
			background: var(--page-hover);
			color: var(--text-primary);

			.fired-weight {
				color: var(--text-primary);
			}
		}

		&.additional {
			color: var(--text-tertiary);
			padding-left: spacing.$unit-2x;
		}
	}

	.fired-weight {
		font-variant-numeric: tabular-nums;
		color: var(--text-tertiary);
	}

	.no-fires {
		margin: 0;
		color: var(--text-tertiary);
		font-size: typography.$font-small;
		font-style: italic;
	}
</style>
