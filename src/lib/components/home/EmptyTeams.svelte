<script lang="ts">
	/**
	 * The empty state of a home card whose item or battle has no teams yet: a
	 * line naming it, and a button to start a team with it already in place.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** The message as HTML; names in it must already be escaped */
		messageHtml: string
		/** The new team page with the item or battle set */
		href: string | null
	}

	let { messageHtml, href }: Props = $props()
</script>

<!-- Same height as one row of team cards plus the "see all" button, so the
     card doesn't jump when switching to something nobody has posted yet -->
<div class="empty">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<p>{@html messageHtml}</p>
	{#if href}
		<Button {href} size="small">{m.home_create_team()}</Button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc($unit * 1.5);
		min-height: 287px;
		color: var(--text-tertiary);
		text-align: center;

		p {
			margin: 0;
		}

		p :global(b) {
			font-weight: $medium;
		}
	}
</style>
