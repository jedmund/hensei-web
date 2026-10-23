<script lang="ts">
	import type { Snippet } from 'svelte'

	// A titled run of skill slots ("Abilities", "Skill 1"). Each child is a slot: its first
	// SkillCard, then any linked ones.
	interface Props {
		title: string
		children: Snippet
	}

	let { title, children }: Props = $props()
</script>

<section class="skill-group">
	<h3 class="group-title">{title}</h3>
	<div class="slot-list">
		{@render children()}
	</div>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.skill-group {
		padding: spacing.$unit-2x;
	}

	.group-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0 0 spacing.$unit 0;
	}

	.slot-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		// A slot: its first card, then its linked cards.
		> :global(.skill-slot) {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-half;
		}
	}
</style>
