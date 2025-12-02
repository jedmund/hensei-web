<svelte:options runes={true} />

<script lang="ts">
	import { toast } from 'svelte-sonner'

	interface Props {
		value: string | number
	}

	let { value }: Props = $props()

	async function copyToClipboard() {
		if (!value) return
		try {
			await navigator.clipboard.writeText(String(value))
			toast.success('Copied to clipboard')
		} catch (err) {
			toast.error('Failed to copy')
		}
	}
</script>

<button class="copyable-text" onclick={copyToClipboard} title="Click to copy">
	<span class="text">{value}</span>
</button>

<style lang="scss">
	@use '$src/themes/colors' as colors;

	.copyable-text {
		display: inline-flex;
		align-items: center;
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
	}

	.text {
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
	}
</style>
