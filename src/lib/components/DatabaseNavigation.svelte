<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import Icon from './Icon.svelte'
	import Tooltip from './ui/Tooltip.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import { DropdownMenu } from 'bits-ui'

	interface Props {
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let { userElement }: Props = $props()

	// Localized links
	const galleryHref = $derived(localizeHref('/teams/explore'))
	const databaseCharactersHref = $derived(localizeHref('/database/characters'))
	const databaseWeaponsHref = $derived(localizeHref('/database/weapons'))
	const databaseSummonsHref = $derived(localizeHref('/database/summons'))
	const databaseJobsHref = $derived(localizeHref('/database/jobs'))
	const databaseGwEventsHref = $derived(localizeHref('/database/gw-events'))
	const databaseArtifactSkillsHref = $derived(localizeHref('/database/artifact-skills'))
	const databaseBulletsHref = $derived(localizeHref('/database/bullets'))
	const databaseRaidsHref = $derived(localizeHref('/database/raids'))
	const databaseRaidGroupsHref = $derived(localizeHref('/database/raid-groups'))

	// Detect current database entity type
	const currentDatabaseEntity = $derived.by(() => {
		const path = $page.url.pathname
		if (path.startsWith(databaseCharactersHref)) return 'character'
		if (path.startsWith(databaseWeaponsHref)) return 'weapon'
		if (path.startsWith(databaseSummonsHref)) return 'summon'
		if (path.startsWith(databaseJobsHref) || path.startsWith(localizeHref('/database/job-skills')))
			return 'job'
		if (path.startsWith(databaseRaidsHref) || path.startsWith(databaseRaidGroupsHref)) return 'raid'
		return null
	})

	// Database "New" dropdown config
	const databaseEntityLabel = $derived(
		currentDatabaseEntity === 'character'
			? m.type_character()
			: currentDatabaseEntity === 'weapon'
				? m.type_weapon()
				: currentDatabaseEntity === 'summon'
					? m.type_summon()
					: currentDatabaseEntity === 'job'
						? m.type_job()
						: currentDatabaseEntity === 'raid'
							? m.type_raid()
							: null
	)
	const databaseNewHref = $derived(
		currentDatabaseEntity === 'character'
			? localizeHref('/database/characters/new')
			: currentDatabaseEntity === 'weapon'
				? localizeHref('/database/weapons/new')
				: currentDatabaseEntity === 'summon'
					? localizeHref('/database/summons/new')
					: null
	)
	const databaseImportHref = $derived(
		currentDatabaseEntity === 'character'
			? localizeHref('/database/characters/import')
			: currentDatabaseEntity === 'weapon'
				? localizeHref('/database/weapons/import')
				: currentDatabaseEntity === 'summon'
					? localizeHref('/database/summons/import')
					: null
	)

	function isDatabaseNavSelected(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
	}
</script>

<div class="database-nav">
	<!-- Back button -->
	<ul role="list" class="database-back-section">
		<li>
			<Tooltip content={m.nav_back_to_site()}>
				<a
					href={galleryHref}
					class="database-back-button"
					aria-label={m.nav_back_to_site()}
				>
					<Icon name="home" size={21} />
				</a>
			</Tooltip>
		</li>
	</ul>

	<!-- Database sub-navigation -->
	<ul role="list" class="database-subnav">
		<li>
			<a
				href={databaseCharactersHref}
				class:selected={isDatabaseNavSelected(databaseCharactersHref)}
			>
				{m.nav_characters()}
			</a>
		</li>
		<li>
			<a href={databaseWeaponsHref} class:selected={isDatabaseNavSelected(databaseWeaponsHref)}>
				{m.nav_weapons()}
			</a>
		</li>
		<li>
			<a href={databaseSummonsHref} class:selected={isDatabaseNavSelected(databaseSummonsHref)}>
				{m.nav_summons()}
			</a>
		</li>
		<li>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="nav-more-trigger">
					<Icon name="ellipsis" size={14} />
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
						<DropdownItem>
							<a href={databaseJobsHref}>{m.nav_jobs()}</a>
						</DropdownItem>
						<DropdownItem>
							<a href={databaseRaidsHref}>{m.nav_raids()}</a>
						</DropdownItem>
						<DropdownMenu.Separator class="dropdown-separator" />
						<DropdownItem>
							<a href={databaseArtifactSkillsHref}>{m.nav_artifact_skills()}</a>
						</DropdownItem>
						<DropdownItem>
							<a href={databaseBulletsHref}>{m.nav_bullets()}</a>
						</DropdownItem>
						<DropdownMenu.Separator class="dropdown-separator" />
						<DropdownItem>
							<a href={databaseGwEventsHref}>{m.nav_unite_and_fight()}</a>
						</DropdownItem>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</li>
	</ul>
</div>

{#if databaseEntityLabel}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="new-item-trigger {userElement ?? ''}">
			<span>{m.nav_new_entity({ entity: databaseEntityLabel ?? '' })}</span>
			<Icon name="chevron-down" size={12} />
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content class="dropdown-content" sideOffset={5} align="end">
				{#if currentDatabaseEntity === 'raid'}
					<DropdownItem>
						<a href={localizeHref('/database/raids/new')}>{m.nav_new_raid()}</a>
					</DropdownItem>
					<DropdownItem>
						<a href={localizeHref('/database/raid-groups/new')}>{m.nav_new_raid_group()}</a>
					</DropdownItem>
				{:else if currentDatabaseEntity === 'job'}
					<DropdownItem>
						<a href={localizeHref('/database/jobs/new')}>{m.nav_new_job()}</a>
					</DropdownItem>
					<DropdownItem>
						<a href={localizeHref('/database/job-accessories/new')}>{m.nav_new_job_accessory()}</a>
					</DropdownItem>
				{:else}
					{#if databaseNewHref}
						<DropdownItem>
							<a href={databaseNewHref}>{m.nav_new_single({ entity: databaseEntityLabel ?? '' })}</a>
						</DropdownItem>
					{/if}
					{#if databaseImportHref}
						<DropdownItem>
							<a href={databaseImportHref}>{m.nav_new_multiple({ entity: databaseEntityLabel ?? '' })}</a>
						</DropdownItem>
					{/if}
					{#if currentDatabaseEntity === 'weapon'}
						<DropdownMenu.Separator class="dropdown-separator" />
						<DropdownItem>
							<a href={localizeHref('/database/series/weapons/new')}>{m.nav_new_weapon_series()}</a>
						</DropdownItem>
					{/if}
					{#if currentDatabaseEntity === 'character'}
						<DropdownMenu.Separator class="dropdown-separator" />
						<DropdownItem>
							<a href={localizeHref('/database/series/characters/new')}>{m.nav_new_character_series()}</a>
						</DropdownItem>
					{/if}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	.database-nav {
		display: flex;
		gap: spacing.$unit;
		align-items: center;

		.database-back-section {
			@include navigation.nav-pill-bar;
			min-height: 49px;
			min-width: 49px;

			.database-back-button {
				border-radius: layout.$full-corner;
				color: var(--text-secondary);
				font-size: typography.$font-small;
				font-weight: typography.$medium;
				text-decoration: none;
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

		.database-subnav {
			@include navigation.nav-pill-bar;
			min-height: 49px;

			li {
				@include navigation.nav-pill-item;
			}

			a {
				@include navigation.nav-pill-link;
			}
		}
	}

	// Style the database "New item" dropdown trigger
	:global(.new-item-trigger) {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
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
