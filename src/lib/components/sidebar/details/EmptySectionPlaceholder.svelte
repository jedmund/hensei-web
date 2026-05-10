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
		/** Lowercase noun (e.g. "roles", "description") inserted into the CTA. */
		sectionName: string
		onclick: () => void
	}

	let { sectionName, onclick }: Props = $props()
</script>

<div class="empty-section-placeholder">
	<Button variant="ghost" size="small" leftIcon="plus" {onclick}>
		{m.add_section_action({ section: sectionName })}
	</Button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;

	.empty-section-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 6rem;
		padding: spacing.$unit-2x;
		background: var(--placeholder-bg);
		border-radius: layout.$item-corner;
	}
</style>
