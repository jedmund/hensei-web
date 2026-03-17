<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		controls?: Snippet
		results?: Snippet
		isLoading?: boolean
		isError?: boolean
		isEmpty?: boolean
		error?: string | null
		onRetry?: () => void
		loadingMessage?: string
		emptyMessage?: string
		errorMessage?: string
	}

	let {
		controls,
		results,
		isLoading = false,
		isError = false,
		isEmpty = false,
		error = null,
		onRetry,
		loadingMessage,
		emptyMessage,
		errorMessage
	}: Props = $props()

	let resultsScrolled = $state(false)
</script>

{#if controls}
	<div class="controls" class:scrolled={resultsScrolled}>
		{@render controls()}
	</div>
{/if}

<div class="results-section" onscroll={(e) => { resultsScrolled = e.currentTarget.scrollTop > 0 }}>
	{#if isLoading}
		<div class="loading">
			<Icon name="loader-2" size={24} />
			<span>{loadingMessage}</span>
		</div>
	{:else if isError}
		<div class="error-state">
			<Icon name="alert-circle" size={24} />
			<p>{error || errorMessage}</p>
			{#if onRetry}
				<Button size="small" onclick={onRetry}>{m.retry()}</Button>
			{/if}
		</div>
	{:else if isEmpty}
		<div class="no-results">
			{emptyMessage}
		</div>
	{:else if results}
		{@render results()}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x $unit;
		flex-shrink: 0;
		border-bottom: 1px solid var(--border-primary);
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid rgba(0, 0, 0, 0.01);
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: 0 $unit-2x;
		min-height: 0;

		.loading,
		.no-results {
			text-align: center;
			padding: $unit-3x;
			color: var(--text-secondary);
			font-size: $font-regular;
		}

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $unit;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}

		.error-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-3x;
			color: var(--text-secondary);

			:global(svg) {
				color: var(--text-tertiary);
			}

			p {
				margin: 0;
				font-size: $font-regular;
			}
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
