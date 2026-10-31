<script lang="ts">
	// Database overview: item search, recently opened, and a
	// compact map of the sections.
	import { goto } from '$app/navigation'
	import { localizeHref, getLocale } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { searchAdapter } from '$lib/api/adapters/search.adapter'
	import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
	import {
		childrenOf,
		groupedSections,
		sectionById,
		sectionHref
	} from '$lib/features/database/sections'
	import { recentPages } from '$lib/features/database/recent.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const role = $derived((data as { role?: number }).role ?? 0)
	const groups = $derived(groupedSections(role))

	// --- Item search -------------------------------------------------------
	let query = $state('')
	let results = $state<UnifiedSearchResult[]>([])
	let searching = $state(false)
	let activeIndex = $state(0)
	let searchInput: HTMLInputElement | undefined = $state()
	let timer: ReturnType<typeof setTimeout> | undefined

	const TYPE_PATH: Record<UnifiedSearchResult['searchableType'], string> = {
		Character: 'characters',
		Weapon: 'weapons',
		Summon: 'summons'
	}

	const TYPE_LABEL: Record<UnifiedSearchResult['searchableType'], () => string> = {
		Character: () => m.type_character(),
		Weapon: () => m.type_weapon(),
		Summon: () => m.type_summon()
	}

	function resultHref(r: UnifiedSearchResult) {
		return localizeHref(`/database/${TYPE_PATH[r.searchableType]}/${r.granblueId}`)
	}

	function resultName(r: UnifiedSearchResult) {
		return getLocale() === 'ja' ? r.nameJp || r.nameEn : r.nameEn || r.nameJp
	}

	$effect(() => {
		const q = query.trim()
		clearTimeout(timer)
		if (q.length < 2) {
			results = []
			searching = false
			return
		}
		searching = true
		timer = setTimeout(async () => {
			try {
				const res = await searchAdapter.searchAll({
					query: q,
					per: 8,
					locale: getLocale() === 'ja' ? 'ja' : 'en'
				})
				if (query.trim() === q) {
					results = res.results
					activeIndex = 0
				}
			} catch {
				results = []
			} finally {
				if (query.trim() === q) searching = false
			}
		}, 200)
	})

	function handleSearchKey(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			activeIndex = Math.min(activeIndex + 1, results.length - 1)
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			activeIndex = Math.max(activeIndex - 1, 0)
		} else if (event.key === 'Enter') {
			const r = results[activeIndex]
			if (r) goto(resultHref(r))
		} else if (event.key === 'Escape') {
			query = ''
			searchInput?.blur()
		}
	}

	// "/" focuses search, like the rest of the web
	function handleGlobalKey(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null
		const typing =
			target?.isContentEditable ||
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.tagName === 'SELECT'
		if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
			event.preventDefault()
			searchInput?.focus()
		}
	}

	const relativeFormat = $derived(new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' }))

	function relativeTime(at: number) {
		const mins = Math.round((at - Date.now()) / 60000)
		if (Math.abs(mins) < 60) return relativeFormat.format(mins, 'minute')
		const hours = Math.round(mins / 60)
		if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour')
		return relativeFormat.format(Math.round(hours / 24), 'day')
	}
</script>

<svelte:window onkeydown={handleGlobalKey} />

<PageMeta title={`${m.nav_database()} / granblue.team`} description={m.page_desc_home()} />

<div class="overview">
	<div class="search" class:open={query.trim().length >= 2}>
		<Icon name="search" size={18} />
		<input
			bind:this={searchInput}
			bind:value={query}
			onkeydown={handleSearchKey}
			type="search"
			placeholder={m.db_nav_search_placeholder()}
			aria-label={m.db_nav_search_placeholder()}
			role="combobox"
			aria-expanded={results.length > 0}
			aria-controls="db-search-results"
		/>
		<kbd>/</kbd>

		{#if query.trim().length >= 2}
			<ul class="results" id="db-search-results" role="listbox">
				{#if searching && results.length === 0}
					<li class="hint">{m.db_nav_searching()}</li>
				{:else if results.length === 0}
					<li class="hint">{m.db_nav_search_empty({ query })}</li>
				{:else}
					{#each results as r, i (r.searchableType + r.granblueId)}
						<li role="option" aria-selected={i === activeIndex}>
							<a
								href={resultHref(r)}
								class:active={i === activeIndex}
								onmouseenter={() => (activeIndex = i)}
							>
								<span class="name">{resultName(r)}</span>
								<span class="type">{TYPE_LABEL[r.searchableType]()}</span>
							</a>
						</li>
					{/each}
				{/if}
			</ul>
		{/if}
	</div>

	{#if recentPages.list.length > 0}
		<section>
			<header class="section-head">
				<h2>{m.db_nav_recent()}</h2>
				<button type="button" class="link-button" onclick={() => recentPages.clear()}>
					{m.db_nav_clear()}
				</button>
			</header>
			<ul class="recent" role="list">
				{#each recentPages.list as r (r.path)}
					<li>
						<a href={r.path}>
							<span class="name">{r.title}</span>
							<span class="meta">
								{sectionById(r.sectionId)?.label() ?? ''} · {relativeTime(r.at)}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section>
		<header class="section-head">
			<h2>{m.db_nav_browse()}</h2>
		</header>
		<div class="browse">
			{#each groups as group (group.id)}
				<div class="browse-group">
					<h3>{group.label()}</h3>
					<ul role="list">
						{#each group.sections as section (section.id)}
							{@const children = childrenOf(section.id, role)}
							<li>
								<a href={localizeHref(sectionHref(section))}>
									<span class="row-text">
										<span class="name">{section.label()}</span>
										{#if children.length > 0}
											<span class="meta">{children.map((c) => c.label()).join(' · ')}</span>
										{/if}
									</span>
									<Icon name="chevron-right-small" size={14} />
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.overview {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-4x;
		padding-top: spacing.$unit;
	}

	h2 {
		margin: 0;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: spacing.$unit;
	}

	.link-button {
		border: none;
		background: none;
		padding: 0;
		color: var(--text-tertiary);
		font-family: var(--font-family);
		font-size: typography.$font-tiny;
		cursor: pointer;

		&:hover {
			color: var(--text-primary);
		}
	}

	// --- Search ---------------------------------------------------------------
	.search {
		position: relative;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: 0 spacing.$unit-2x;
		border-radius: layout.$card-corner;
		background: var(--card-bg);
		box-shadow: var(--shadow-sm);
		color: var(--text-tertiary);
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		&:focus-within {
			box-shadow:
				var(--shadow-sm),
				0 0 0 2px var(--focus-ring);
		}

		input {
			flex: 1;
			min-width: 0;
			padding: spacing.$unit-2x 0;
			border: none;
			background: transparent;
			color: var(--text-primary);
			font-family: var(--font-family);
			font-size: typography.$font-regular;
			outline: none;

			&::-webkit-search-cancel-button {
				display: none;
			}
		}

		&:focus-within kbd {
			display: none;
		}

		kbd {
			font-family: var(--font-family);
			font-size: typography.$font-tiny;
			color: var(--text-tertiary);
			border: 1px solid var(--separator-bg, currentColor);
			border-radius: 4px;
			padding: 0 6px;

			@media (hover: none) {
				display: none;
			}
		}
	}

	.results {
		position: absolute;
		z-index: 10;
		top: calc(100% + spacing.$unit-half);
		left: 0;
		right: 0;
		padding: spacing.$unit-half;
		border-radius: layout.$card-corner;
		background: var(--card-bg);
		box-shadow: var(--shadow-md, var(--shadow-sm));

		a {
			display: flex;
			justify-content: space-between;
			gap: spacing.$unit-2x;
			padding: spacing.$unit spacing.$unit;
			border-radius: layout.$item-corner;
			color: var(--text-primary);
			text-decoration: none;
			font-size: typography.$font-small;

			&.active {
				background: var(--button-contained-bg-hover);
			}
		}

		.type {
			color: var(--text-tertiary);
			text-transform: capitalize;
		}

		.hint {
			padding: spacing.$unit;
			color: var(--text-tertiary);
			font-size: typography.$font-small;
		}
	}

	// --- Recently opened -----------------------------------------------------
	.recent {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: spacing.$unit;

		a {
			display: flex;
			flex-direction: column;
			gap: 2px;
			padding: spacing.$unit spacing.$unit-2x;
			border-radius: layout.$card-corner;
			background: var(--card-bg);
			box-shadow: var(--shadow-sm);
			text-decoration: none;
			@include effects.smooth-transition(effects.$duration-quick, transform, box-shadow);

			&:hover {
				transform: translateY(-1px);
				box-shadow: var(--shadow-md, var(--shadow-sm));
			}
		}
	}

	.name {
		color: var(--text-primary);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		color: var(--text-tertiary);
		font-size: typography.$font-tiny;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	// --- Browse ---------------------------------------------------------------
	.browse {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: spacing.$unit-2x;
		align-items: start;
	}

	.browse-group {
		padding: spacing.$unit;
		border-radius: layout.$page-corner;
		background: var(--card-bg);
		box-shadow: var(--shadow-sm);

		h3 {
			margin: 0;
			padding: spacing.$unit spacing.$unit spacing.$unit-half;
			font-size: typography.$font-tiny;
			font-weight: typography.$medium;
			color: var(--text-tertiary);
		}

		a {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: spacing.$unit;
			padding: spacing.$unit spacing.$unit;
			border-radius: layout.$item-corner;
			color: var(--text-tertiary);
			text-decoration: none;
			@include effects.smooth-transition(effects.$duration-quick, background-color);

			&:hover {
				background: var(--button-contained-bg-hover);
			}
		}

		.row-text {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}
	}
</style>
