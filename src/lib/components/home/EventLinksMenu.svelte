<script lang="ts">
	/**
	 * A globe button over an event's cover that opens its pages on other sites
	 * (gbf.wiki, GameWith, Kamigame). Shows nothing when the event has none.
	 */
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { buildGamewithUrl, buildKamigameUrl, buildWikiEnUrl } from '$lib/utils/external-links'
	import type { GameEvent } from '$lib/types/api/event'
	import * as m from '$lib/paraglide/messages'

	let { event }: { event: Pick<GameEvent, 'wikiEn' | 'gamewith' | 'kamigame'> } = $props()

	// Site names, not translated
	const links = $derived(
		[
			{ label: 'gbf.wiki', href: buildWikiEnUrl(event.wikiEn) },
			{ label: 'GameWith', href: buildGamewithUrl(event.gamewith) },
			{ label: 'Kamigame', href: buildKamigameUrl(event.kamigame, 'event') }
		].filter((link): link is { label: string; href: string } => !!link.href)
	)
</script>

{#if links.length > 0}
	<DropdownMenu align="end">
		{#snippet trigger({ props })}
			<Button
				{...props}
				class="event-links-trigger"
				variant="secondary"
				size="small"
				shape="circular"
				iconOnly
				icon="globe"
				aria-label={m.home_event_links()}
			/>
		{/snippet}
		{#snippet menu()}
			{#each links as link (link.label)}
				<DropdownItem href={link.href} external>{link.label}</DropdownItem>
			{/each}
		{/snippet}
	</DropdownMenu>
{/if}

<style lang="scss">
	// Over the art, so it carries the cover pills' dark glass rather than the page's ghost style
	:global(.event-links-trigger) {
		--button-bg: rgba(0, 0, 0, 0.6);
		--button-bg-hover: rgba(0, 0, 0, 0.75);
		--button-text: #fff;
		--button-text-hover: #fff;
		backdrop-filter: blur(4px);
	}
</style>
