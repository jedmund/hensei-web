<script lang="ts">
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import { wikiToHtml } from '$lib/utils/wikiText'
	import type { DescriptionSegment } from '$lib/types/api/entities'

	interface Props {
		/** Display segments from the API; rendered when present */
		segments?: DescriptionSegment[] | undefined
		/** Raw wiki text, the fallback for responses without segments */
		raw?: string | null | undefined
		class?: string
	}

	const { segments, raw, class: className = '' }: Props = $props()
</script>

{#if segments?.length}
	<p class="skill-description {className}">
		{#each segments as segment, i (i)}
			{#if segment.tooltip}
				<RichTooltip>
					{#snippet content()}
						<span class="skill-description-tip">{segment.tooltip}</span>
					{/snippet}
					<span class="has-tooltip" class:strong={segment.strong}>{segment.text}</span>
				</RichTooltip>
			{:else if segment.strong}
				<strong>{segment.text}</strong>
			{:else}
				{segment.text}
			{/if}
		{/each}
	</p>
{:else if raw}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- wikiToHtml emits only whitelisted tags -->
	<p class="skill-description {className}">{@html wikiToHtml(raw)}</p>
{/if}

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.skill-description {
		white-space: pre-line;

		:global(strong),
		.strong {
			font-weight: typography.$bold;
		}

		:global(em) {
			font-style: italic;
		}
	}

	.has-tooltip {
		text-decoration: underline dotted;
		text-underline-offset: 2px;
		cursor: help;
	}

	:global(.skill-description-tip) {
		white-space: pre-line;
	}
</style>
