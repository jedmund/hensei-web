<script lang="ts">
	// Grouped list of database sections, used by the desktop
	// sidebar and the mobile/tablet section sheet.
	import { slide } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import { page } from '$app/state'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import SlidingSelection from '$lib/components/ui/SlidingSelection.svelte'
	import {
		childrenOf,
		delocalize,
		groupedSections,
		rootOf,
		sectionForUrl,
		sectionHref
	} from '$lib/features/database/sections'

	interface Props {
		role: number
		element?: string | undefined
		/** Animate the selection indicator (off inside the sheet, which remounts) */
		animated?: boolean
	}

	let { role, element, animated = true }: Props = $props()

	let host: HTMLElement | undefined = $state()

	const groups = $derived(groupedSections(role))
	const current = $derived(sectionForUrl(page.url))
	const activeRoot = $derived(rootOf(current))
	const onOverview = $derived(delocalize(page.url.pathname) === '/database')
	const trigger = $derived(page.url.pathname + page.url.search)
</script>

<nav
	class="section-list element-{element ?? 'null'}"
	bind:this={host}
	aria-label={m.db_nav_sections()}
>
	{#if animated}
		<SlidingSelection {host} selector=".item.selected" {trigger} class="indicator" />
	{/if}

	<a
		href={localizeHref('/database')}
		class="item"
		class:selected={onOverview}
		aria-current={onOverview ? 'page' : undefined}
	>
		{m.db_nav_overview()}
	</a>

	{#each groups as group (group.id)}
		<section class="group">
			<h2>{group.label()}</h2>
			<ul role="list">
				{#each group.sections as section (section.id)}
					{@const isCurrent = current?.id === section.id}
					{@const children = childrenOf(section.id, role)}
					<li>
						<a
							href={localizeHref(sectionHref(section))}
							class="item"
							class:selected={isCurrent}
							aria-current={isCurrent ? 'page' : undefined}
						>
							{section.label()}
						</a>

						{#if activeRoot?.id === section.id && children.length > 0}
							<ul
								role="list"
								class="children"
								transition:slide={{ duration: 180, easing: cubicOut }}
							>
								{#each children as child (child.id)}
									{@const childCurrent = current?.id === child.id}
									<li>
										<a
											href={localizeHref(sectionHref(child))}
											class="item child"
											class:selected={childCurrent}
											aria-current={childCurrent ? 'page' : undefined}
										>
											{child.label()}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</nav>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;

	$elements: null, wind, fire, water, earth, dark, light;

	.section-list {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		--sliding-selection-radius: #{layout.$item-corner};
	}

	.section-list :global(.indicator) {
		z-index: 0;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		h2 {
			margin: 0;
			padding: 0 spacing.$unit-2x;
			font-size: typography.$font-tiny;
			font-weight: typography.$medium;
			color: var(--text-tertiary);
		}

		ul {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
	}

	.children {
		padding: 2px 0 spacing.$unit-half spacing.$unit-2x;
	}

	.item {
		@include navigation.nav-list-item;
		position: relative;
		z-index: 1;
		font-size: typography.$font-small;
		padding: calc(spacing.$unit * 0.875) spacing.$unit-2x;

		&.child {
			color: var(--text-tertiary);
		}
	}

	@each $el in $elements {
		.element-#{$el} {
			--sliding-selection-bg: var(--#{$el}-nav-selected-bg);

			.item.selected {
				color: var(--#{$el}-nav-selected-text, var(--text-primary));
			}
		}
	}

	// Without the sliding indicator (sheet), paint the selection directly
	@each $el in $elements {
		.element-#{$el}:not(:has(:global(.indicator))) .item.selected {
			background: var(--#{$el}-nav-selected-bg);
		}
	}
</style>
