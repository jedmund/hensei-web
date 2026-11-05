<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		subtitle?: string
		/** Shown in place of the subtitle while the control's value isn't valid */
		error?: string | undefined
		/** Optional leading icon, shown to the left of the title and subtitle. */
		icon?: Snippet
		control: Snippet
		/** Size the control to its content (e.g. a switch) instead of the fixed column, so the text gets the rest. */
		compact?: boolean
	}

	let { title, subtitle, error, icon, control, compact = false }: Props = $props()
</script>

<div class="settings-row">
	<div class="lead">
		{#if icon}
			<div class="icon">
				{@render icon()}
			</div>
		{/if}
		<div class="text">
			<span class="title">{title}</span>
			{#if error}
				<p class="subtitle error" role="alert">{error}</p>
			{:else if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>
	</div>
	<div class="control" class:compact>
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

		.lead {
			display: flex;
			align-items: center;
			gap: spacing.$unit-2x;
			min-width: 0;
		}

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			min-width: spacing.$unit-4x;
			color: var(--text-primary);
		}

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

				&.error {
					color: var(--danger);
				}
			}
		}

		.control {
			flex-shrink: 0;
			// Room for a URL or an ID, while leaving the text at least half the row
			width: min(280px, 50%);
			display: flex;
			justify-content: flex-end;

			// Make select triggers and fieldsets fill the control width
			:global([data-select-trigger]),
			:global(.fieldset) {
				width: 100%;
			}

			&.compact {
				width: auto;
			}
		}
	}
</style>
