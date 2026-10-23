<script lang="ts">
	/**
	 * Centered "Add {section}" CTA used by the team-owner read-only details
	 * sidebar in place of an empty Mastery / Roles / Description / Substitutes
	 * section. Click sends the user into the edit pane, optionally on a
	 * specific tab.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** Title-cased noun (e.g. "Over Mastery", "Roles") inserted into the CTA. */
		sectionName: string
		/** Optional descriptive text shown above the button. */
		description?: string | undefined
		onclick: () => void
	}

	let { sectionName, description, onclick }: Props = $props()
</script>

<div class="empty-section-placeholder">
	{#if description}
		<p class="description">{description}</p>
	{/if}
	<Button variant="ghost" size="small" leftIcon="plus" {onclick}>
		{m.add_section_action({ section: sectionName })}
	</Button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.empty-section-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 6rem;
		margin: 0 spacing.$unit;
		padding: spacing.$unit-2x;
		border: 2px dashed var(--border-subtle);
		border-radius: layout.$item-corner;
		gap: spacing.$unit;
	}

	.description {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		text-align: center;
	}
</style>
