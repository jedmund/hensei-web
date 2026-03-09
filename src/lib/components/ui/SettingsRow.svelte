
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		subtitle?: string
		control: Snippet
	}

	let { title, subtitle, control }: Props = $props()
</script>

<div class="settings-row">
	<div class="text">
		<span class="title">{title}</span>
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>
	<div class="control">
		{@render control()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;

		.text {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-half;

			.title {
				font-size: typography.$font-regular;
				color: var(--text-primary);
			}

			.subtitle {
				margin: 0;
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}

		.control {
			flex-shrink: 0;
			width: 160px;
			display: flex;
			justify-content: flex-end;

			// Make select triggers and fieldsets fill the control width
			:global([data-select-trigger]),
			:global(.fieldset) {
				width: 100%;
			}
		}
	}
</style>
