
<script lang="ts">
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		value: string | number
	}

	let { value }: Props = $props()

	async function copyToClipboard() {
		if (!value) return
		try {
			await navigator.clipboard.writeText(String(value))
			toast.success(m.toast_copied())
		} catch (err) {
			toast.error(m.toast_copy_failed())
		}
	}
</script>

<button class="copyable-text" onclick={copyToClipboard} title={m.tooltip_click_to_copy()}>
	<span class="text">{value}</span>
</button>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.copyable-text {
		display: inline-flex;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: var(--text-primary);
		cursor: pointer;
		border-radius: layout.$item-corner-small;
		transition: color 0.15s ease;

		&:hover {
			color: var(--text-primary);
		}
	}

	.text {
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
	}
</style>
