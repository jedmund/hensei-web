<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import {
		difficultyAdapter,
		type DifficultyPreviewResult
	} from '$lib/api/adapters/difficulty.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'

	let shortcode = $state('')
	let result = $state<DifficultyPreviewResult | null>(null)
	let error = $state<string | null>(null)
	let loading = $state(false)

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

	const breakdownComponents = $derived.by(() => {
		if (!result?.breakdown) return []
		const components = (result.breakdown as { components?: unknown[] }).components ?? []
		return components as Array<{
			name: string
			weight: number
			present: boolean
			raw_score: number | null
			weighted_score: number | null
			fired: Array<{ id: string; name: string; rule_type: string; weight: number }>
		}>
	})
</script>

<div class="preview-panel">
	<p class="hint">
		Score a real party against the current ruleset without persisting. Useful when tuning weights.
	</p>

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
		<Button variant="primary" onclick={runPreview} disabled={loading || !shortcode.trim()}>
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
				<span class="result-version">Ruleset v{result.ruleset_version}</span>
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
											{((c.raw_score ?? 0) * 100).toFixed(0)}%
										{:else}
											No data
										{/if}
									</span>
								</div>
								{#if c.fired.length > 0}
									<ul class="fired-list">
										{#each c.fired as f (f.id)}
											<li class="fired-row">
												<span class="fired-name">{f.name}</span>
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
		background: var(--accent-red-bg, rgba(220, 64, 64, 0.1));
		color: var(--accent-red, #d04040);
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
		width: 28px;
		height: 28px;
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
		gap: spacing.$unit;

		h4 {
			margin: 0;
			font-size: typography.$font-regular;
			font-weight: typography.$bold;
			color: var(--text-secondary);
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: spacing.$unit;
		}
	}

	.breakdown-row {
		padding: spacing.$unit;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$item-corner;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

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
	}

	.breakdown-score {
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.fired-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth !important;
		margin-top: spacing.$unit-half !important;
	}

	.fired-row {
		display: flex;
		justify-content: space-between;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		padding: spacing.$unit-fourth 0;
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
