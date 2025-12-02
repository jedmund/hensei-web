<svelte:options runes={true} />

<script lang="ts">
	interface Props {
		value: string | number
	}

	let { value }: Props = $props()

	let copied = $state(false)

	async function copyToClipboard() {
		if (!value) return
		try {
			await navigator.clipboard.writeText(String(value))
			copied = true
			setTimeout(() => {
				copied = false
			}, 1500)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}
</script>

<button class="copyable-text" class:copied onclick={copyToClipboard} title="Click to copy">
	<span class="text">{value}</span>
	{#if copied}
		<span class="copied-indicator">Copied!</span>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.copyable-text {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: colors.$grey-30;
		cursor: pointer;
		border-radius: 4px;
		transition: color 0.15s ease;

		&:hover {
			color: colors.$grey-10;
		}

		&.copied .text {
			color: colors.$grey-50;
		}
	}

	.text {
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
	}

	.copied-indicator {
		font-size: typography.$font-small;
		color: colors.$grey-50;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
