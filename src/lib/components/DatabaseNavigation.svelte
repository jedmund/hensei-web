<script lang="ts">
	// Database top bar. Breadcrumb down to the record and mode,
	// a section sheet below 1100px (where the sidebar is hidden), and the
	// "New" menu from the section registry.
	import { localizeHref, getLocale } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/state'
	import { afterNavigate } from '$app/navigation'
	import Icon from './Icon.svelte'
	import Tooltip from './ui/Tooltip.svelte'
	import BottomSheet from './ui/BottomSheet.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import DatabaseSectionList from './database/DatabaseSectionList.svelte'
	import { DropdownMenu } from 'bits-ui'
	import { rootOf, sectionForUrl, sectionHref } from '$lib/features/database/sections'
	import { modeLabel, recordTitle } from '$lib/features/database/breadcrumb'

	interface Props {
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
		role?: number | null | undefined
	}

	let { userElement, role: accountRole }: Props = $props()

	let sheetOpen = $state(false)
	afterNavigate(() => (sheetOpen = false))

	const galleryHref = $derived(localizeHref('/'))
	const databaseHref = $derived(localizeHref('/database'))
	const role = $derived(accountRole ?? 0)

	const current = $derived(sectionForUrl(page.url))
	const root = $derived(rootOf(current))
	const record = $derived(recordTitle(page.data as Record<string, unknown>, getLocale()))
	const mode = $derived(modeLabel(page.url.pathname))

	interface Crumb {
		label: string
		href?: string | undefined
	}

	const crumbs = $derived.by(() => {
		const list: Crumb[] = []
		if (root) list.push({ label: root.label(), href: localizeHref(sectionHref(root)) })
		if (current && current.id !== root?.id) {
			list.push({ label: current.label(), href: localizeHref(sectionHref(current)) })
		}
		if (record) {
			// On /edit (and similar sub-pages) the record crumb links back to its detail page
			const detailPath = page.url.pathname.replace(/\/(edit|style(\/edit)?)$/, '')
			list.push({
				label: record,
				href: detailPath !== page.url.pathname ? detailPath : undefined
			})
		}
		if (mode && mode !== record) list.push({ label: mode })
		// The last crumb is where you are: plain text, not a link
		const last = list.at(-1)
		if (last) last.href = undefined
		return list
	})

	const newActions = $derived(root?.actions ?? [])
	const newLabel = $derived(root?.entity ? m.nav_new_entity({ entity: root.entity() }) : null)
</script>

<div class="database-nav">
	<ul role="list" class="database-back-section">
		<li>
			<Tooltip content={m.nav_back_to_site()}>
				<a href={galleryHref} class="database-back-button" aria-label={m.nav_back_to_site()}>
					<Icon name="home" size={21} />
				</a>
			</Tooltip>
		</li>
	</ul>

	<nav class="database-crumbs" aria-label="Breadcrumb">
		<button
			type="button"
			class="sections-trigger"
			aria-label={m.db_nav_sections()}
			onclick={() => (sheetOpen = true)}
		>
			<Icon name="menu" size={16} />
		</button>
		<ol role="list">
			<li class="crumb root-crumb" class:only={crumbs.length === 0}>
				{#if crumbs.length === 0}
					<span aria-current="page">{m.nav_database()}</span>
				{:else}
					<a href={databaseHref}>{m.nav_database()}</a>
				{/if}
			</li>
			{#each crumbs as crumb, i (i)}
				<li class="crumb" class:last={i === crumbs.length - 1}>
					<Icon name="chevron-right-small" size={12} />
					{#if crumb.href}
						<a href={crumb.href}>{crumb.label}</a>
					{:else}
						<span aria-current="page">{crumb.label}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
</div>

{#if newLabel && newActions.length > 0}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="new-item-trigger {userElement ?? ''}">
			<Icon name="plus" size={14} />
			<span class="new-label">{newLabel}</span>
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content class="dropdown-content" sideOffset={5} align="end">
				{#each newActions as group, i (i)}
					{#if i > 0}
						<DropdownMenu.Separator class="dropdown-separator" />
					{/if}
					{#each group as action (action.href)}
						<DropdownItem>
							<a href={localizeHref(action.href)}>{action.label()}</a>
						</DropdownItem>
					{/each}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<BottomSheet bind:open={sheetOpen} title={m.nav_database()}>
	<div class="sheet-sections">
		<DatabaseSectionList {role} element={userElement} animated={false} />
	</div>
</BottomSheet>

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	.database-nav {
		display: flex;
		gap: spacing.$unit;
		align-items: center;
		min-width: 0;
		flex: 1;
	}

	.database-back-section {
		@include navigation.nav-pill-bar;
		min-height: 49px;
		min-width: 49px;
		flex-shrink: 0;

		.database-back-button {
			border-radius: layout.$full-corner;
			color: var(--text-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: calc(spacing.$unit * 1.25);
			aspect-ratio: 1;

			&:hover {
				color: var(--text-primary);
			}
		}
	}

	.database-crumbs {
		@include navigation.nav-pill-bar;
		min-height: 49px;
		box-sizing: border-box;
		align-items: center;
		min-width: 0;
		max-width: 100%;

		ol {
			display: flex;
			align-items: center;
			min-width: 0;
			list-style: none;
			margin: 0;
			padding: 0 spacing.$unit-half;
		}
	}

	.crumb {
		display: flex;
		align-items: center;
		gap: 2px;
		min-width: 0;
		color: var(--text-tertiary);

		a,
		span {
			padding: spacing.$unit (spacing.$unit * 1.25);
			border-radius: layout.$full-corner;
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		a {
			color: var(--menu-text);
			text-decoration: none;

			&:hover {
				background-color: var(--menu-bg-item-hover);
			}
		}

		span {
			color: var(--text-primary);
			font-weight: typography.$bold;
		}
	}

	.sections-trigger {
		display: none;
		align-items: center;
		justify-content: center;
		width: 37px;
		height: 37px;
		flex-shrink: 0;
		border: none;
		border-radius: layout.$full-corner;
		background: transparent;
		color: var(--menu-text);
		cursor: pointer;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}
	}

	.sheet-sections {
		padding-bottom: spacing.$unit-2x;
	}

	// Below 1100px the sidebar is hidden: the menu button opens the section sheet
	@media (max-width: calc(#{layout.$database-sidebar-breakpoint} - 1px)) {
		.sections-trigger {
			display: flex;
		}
	}

	// Phones: keep only the most specific crumbs
	@media (max-width: 768px) {
		.database-nav {
			gap: spacing.$unit-half;
		}

		.root-crumb:not(.only) {
			display: none;
		}

		.crumb:not(.last):not(.root-crumb) {
			display: none;
		}

		.crumb.last :global(svg) {
			display: none;
		}

		.new-label {
			display: none;
		}
	}

	:global(.new-item-trigger) {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		flex-shrink: 0;
		padding: calc(spacing.$unit * 1.5) spacing.$unit-2x;
		border-radius: layout.$full-corner;
		background-color: var(--button-primary-bg);
		color: var(--button-primary-text);
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		transition: background-color 0.2s ease;
	}
	:global(.new-item-trigger:hover) {
		background-color: var(--button-primary-bg-hover);
	}

	@media (max-width: 768px) {
		:global(.new-item-trigger) {
			padding: calc(spacing.$unit * 1.5);
		}
	}

	@each $el in $elements {
		:global(.new-item-trigger.#{$el}) {
			background-color: var(--#{$el}-button-bg);
			color: if($el == light, black, white);
		}
		:global(.new-item-trigger.#{$el}:hover) {
			background-color: var(--#{$el}-button-bg-hover);
		}
	}

	:global(.dropdown-content) {
		@include dropdown.dropdown-content;
	}

	:global(.dropdown-separator) {
		@include dropdown.dropdown-separator;
	}
</style>
