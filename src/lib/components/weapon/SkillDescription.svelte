<script lang="ts">
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import EffectTooltip from '$lib/components/skills/EffectTooltip.svelte'
	import { wikiToHtml } from '$lib/utils/wikiText'
	import type { CharacterSkillEffect, DescriptionSegment } from '$lib/types/api/entities'

	interface Props {
		/** Display segments from the API; rendered when present */
		segments?: DescriptionSegment[] | undefined
		/** Raw wiki text, the fallback for responses without segments */
		raw?: string | null | undefined
		/** Character skills: the version's effects, which `effect` segments point at by ordinal */
		effects?: CharacterSkillEffect[] | undefined
		class?: string
	}

	const { segments, raw, effects, class: className = '' }: Props = $props()

	const effectsByOrdinal = $derived(
		new Map((effects ?? []).map((effect) => [effect.ordinal, effect]))
	)

	// One paragraph per line, so the space between lines is ours to set: a segment that
	// spans a line break is split, each piece keeping the segment's formatting.
	const paragraphs = $derived.by(() => {
		const lines: DescriptionSegment[][] = [[]]
		for (const segment of segments ?? []) {
			segment.text.split('\n').forEach((text, index) => {
				if (index > 0) lines.push([])
				if (text) lines[lines.length - 1]!.push({ ...segment, text })
			})
		}
		return lines.filter((line) => line.length)
	})
</script>

{#if paragraphs.length}
	<div class="skill-description {className}">
		{#each paragraphs as line, l (l)}
			<p>{@render paragraph(line)}</p>
		{/each}
	</div>
{:else if raw}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- wikiToHtml emits only whitelisted tags -->
	<p class="skill-description {className}">{@html wikiToHtml(raw)}</p>
{/if}

{#snippet paragraph(line: DescriptionSegment[])}
	{#each line as segment, i (i)}
		{@const effect = segment.effect != null ? effectsByOrdinal.get(segment.effect) : undefined}
		{#if effect}
			<EffectTooltip {effect} text={segment.text} strong={segment.strong ?? false} />
		{:else if segment.skill}
			<span class="skill-reference">{segment.text}</span>
		{:else if segment.tooltip}
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
{/snippet}

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;

	.skill-description {
		white-space: pre-line;

		// Segment paragraphs; set --skill-description-gap to change the space between them.
		&:is(div) {
			display: flex;
			flex-direction: column;
			gap: var(--skill-description-gap, #{spacing.$unit-half});
		}

		p {
			margin: 0;
		}

		:global(strong),
		.strong {
			font-weight: typography.$bold;
		}

		:global(em) {
			font-style: italic;
		}
	}

	.skill-reference {
		font-weight: typography.$medium;
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
