<script lang="ts">
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import type { CharacterSkillEffect } from '$lib/types/api/entities'
	import { effectStatusName } from '$lib/utils/skillEffects'
	import { appLocale } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** The skill effect a status mention in a description produced */
		effect: CharacterSkillEffect
		/** The mention's text as the description writes it */
		text: string
		strong?: boolean
	}

	const { effect, text, strong = false }: Props = $props()

	const CATEGORY_LABEL: Record<string, () => string> = {
		buff: m.effect_tooltip_buff,
		debuff: m.effect_tooltip_debuff,
		field: m.effect_tooltip_field,
		special: m.effect_tooltip_special
	}

	// The effect's own category (a status can be a buff in one skill and a debuff in another).
	const category = $derived(effect.category ?? effect.status?.category ?? undefined)
	const categoryLabel = $derived(category ? CATEGORY_LABEL[category]?.() : undefined)
	const name = $derived(effectStatusName(effect) ?? text)

	const amount = $derived.by(() => {
		if (!effect.amount) return undefined
		return effect.amountMax
			? `${effect.amount} (${m.effect_tooltip_max({ value: effect.amountMax })})`
			: effect.amount
	})

	const duration = $derived.by(() => {
		const value = effect.durationValue
		switch (effect.durationUnit) {
			case 'indefinite':
				return m.effect_tooltip_indefinite()
			case 'turns':
				return value != null ? m.character_skills_turns({ n: value }) : undefined
			case 'seconds':
				return value != null ? m.character_skills_seconds({ n: value }) : undefined
			default:
				return undefined
		}
	})

	const accuracy = $derived(
		effect.accuracy === 'g' ? m.effect_tooltip_guaranteed() : effect.accuracy || undefined
	)

	const facts = $derived(
		[
			{ label: m.effect_tooltip_amount(), value: amount },
			{ label: m.character_skills_duration(), value: duration },
			{ label: m.effect_tooltip_accuracy(), value: accuracy }
		].filter((fact) => fact.value)
	)

	// Status descriptions are English only; Japanese shows the facts alone.
	const description = $derived(appLocale() === 'en' ? effect.status?.description : undefined)
</script>

<RichTooltip class="effect-tooltip-trigger">
	{#snippet content()}
		<div class="effect-card" data-category={category}>
			<div class="header">
				<span class="name">{name}</span>
				{#if categoryLabel}<span class="category">{categoryLabel}</span>{/if}
			</div>
			{#if facts.length}
				<dl class="facts">
					{#each facts as fact (fact.label)}
						<div class="fact">
							<dt>{fact.label}</dt>
							<dd>{fact.value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
			{#if description}<p class="description">{description}</p>{/if}
		</div>
	{/snippet}
	<span class="effect-mention" class:strong data-category={category}>{text}</span>
</RichTooltip>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	[data-category] {
		--effect-color: var(--text-tertiary);
	}
	[data-category='buff'] {
		--effect-color: var(--effect-buff);
	}
	[data-category='debuff'] {
		--effect-color: var(--effect-debuff);
	}
	[data-category='field'] {
		--effect-color: var(--effect-field);
	}

	// The trigger carries type="button", which the reset gives button appearance (rendered
	// inline-block); plain inline keeps punctuation after the mention on its line.
	:global(.effect-tooltip-trigger) {
		appearance: none;
	}

	.effect-mention {
		font-weight: typography.$medium;
		text-decoration: underline dotted var(--effect-color, var(--text-secondary));
		text-decoration-thickness: spacing.$unit-fourth;
		text-underline-offset: spacing.$unit-fourth;
		cursor: help;

		&.strong {
			font-weight: typography.$bold;
		}
	}

	// 15% wider than RichTooltip's usual max-width (spacing.$unit * 31.25).
	:global(.rich-tooltip-content:has(.effect-card)) {
		max-width: calc(spacing.$unit * 31.25 * 1.15);
	}

	.effect-card {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		min-width: calc(spacing.$unit * 22);
	}

	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.name {
		font-size: typography.$font-small;
		font-weight: typography.$bold;
	}

	.category {
		flex-shrink: 0;
		padding: 0 spacing.$unit;
		border-radius: layout.$full-corner;
		background: var(--effect-color);
		color: white;
		font-size: typography.$font-tiny;
		line-height: 1.6;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half spacing.$unit-2x;
		margin: 0;
	}

	.fact {
		display: flex;
		flex-direction: column;

		dt {
			font-size: typography.$font-tiny;
			font-weight: typography.$normal;
			opacity: 0.7;
		}

		dd {
			margin: 0;
			font-size: typography.$font-small;
		}
	}

	.description {
		margin: 0;
		font-size: typography.$font-small;
		font-weight: typography.$normal;
		line-height: 1.5;
		opacity: 0.9;
		white-space: pre-line;
	}
</style>
