<script lang="ts">
	import { onMount, tick } from 'svelte'
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { userAdapter, type UserInfo } from '$lib/api/adapters/user.adapter'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import Icon from '../Icon.svelte'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		userElement?: ElementName
		onClose: () => void
	}

	const { userElement, onClose }: Props = $props()

	let inputEl = $state<HTMLInputElement | undefined>()
	let rootEl = $state<HTMLDivElement | undefined>()
	let inputValue = $state('')
	let results = $state<UserInfo[]>([])
	let isLoading = $state(false)
	let activeIndex = $state(0)
	let isComposing = $state(false)
	let hasSearched = $state(false)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null

	async function runSearch(query: string) {
		if (query.length < 2) {
			results = []
			hasSearched = false
			activeIndex = 0
			return
		}
		isLoading = true
		try {
			const users = await userAdapter.searchUsers(query)
			results = users
			activeIndex = 0
			hasSearched = true
		} catch {
			results = []
			hasSearched = true
		} finally {
			isLoading = false
		}
	}

	function scheduleSearch(value: string) {
		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => runSearch(value.trim()), 300)
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement
		inputValue = target.value
		if (isComposing) return
		scheduleSearch(inputValue)
	}

	function handleCompositionStart() {
		isComposing = true
	}

	function handleCompositionEnd(event: CompositionEvent) {
		isComposing = false
		const target = event.target as HTMLInputElement
		inputValue = target.value
		scheduleSearch(inputValue)
	}

	async function navigateTo(user: UserInfo) {
		await goto(localizeHref(`/${user.username}`))
		onClose()
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isComposing) return

		if (event.key === 'Escape') {
			event.preventDefault()
			onClose()
			return
		}

		if (event.key === 'ArrowDown') {
			if (results.length === 0) return
			event.preventDefault()
			activeIndex = (activeIndex + 1) % results.length
			return
		}

		if (event.key === 'ArrowUp') {
			if (results.length === 0) return
			event.preventDefault()
			activeIndex = (activeIndex - 1 + results.length) % results.length
			return
		}

		if (event.key === 'Enter') {
			if (results.length === 0) return
			event.preventDefault()
			const target = results[activeIndex]
			if (target) navigateTo(target)
		}
	}

	function handleDocumentMousedown(event: MouseEvent) {
		if (!rootEl) return
		if (event.target instanceof Node && rootEl.contains(event.target)) return
		onClose()
	}

	onMount(() => {
		tick().then(() => inputEl?.focus())
		document.addEventListener('mousedown', handleDocumentMousedown)
		return () => {
			document.removeEventListener('mousedown', handleDocumentMousedown)
			if (searchTimeout) clearTimeout(searchTimeout)
		}
	})

	const showDropdown = $derived(inputValue.trim().length >= 2 && (isLoading || hasSearched))
	const elementClass = $derived(userElement ?? '')
</script>

<div class="nav-user-search {elementClass}" bind:this={rootEl}>
	<div class="search-input">
		<Icon name="search" size={16} />
		<input
			bind:this={inputEl}
			type="text"
			value={inputValue}
			placeholder={m.nav_search_users_placeholder()}
			aria-label={m.nav_search_users_aria()}
			autocomplete="off"
			spellcheck="false"
			oninput={handleInput}
			oncompositionstart={handleCompositionStart}
			oncompositionend={handleCompositionEnd}
			onkeydown={handleKeydown}
		/>
		<button type="button" class="close-button" aria-label="Close search" onclick={onClose}>
			<Icon name="close" size={12} />
		</button>
	</div>

	{#if showDropdown}
		<div class="search-results" role="listbox">
			{#if results.length === 0 && !isLoading}
				<div class="search-empty">{m.nav_search_no_results()}</div>
			{:else}
				{#each results as user, i (user.id)}
					<button
						type="button"
						class="search-result"
						class:active={i === activeIndex}
						role="option"
						aria-selected={i === activeIndex}
						onmouseenter={() => (activeIndex = i)}
						onclick={() => navigateTo(user)}
					>
						{#if user.avatar?.picture}
							<img
								src={getAvatarSrc(user.avatar.picture)}
								srcset={getAvatarSrcSet(user.avatar.picture)}
								alt=""
								class="result-avatar"
								width="24"
								height="24"
							/>
						{:else}
							<span class="result-avatar avatar-placeholder"></span>
						{/if}
						<span class="result-text">
							{#if user.displayName}
								<span class="result-display-name">{user.displayName}</span>
								<span class="result-username">@{user.username}</span>
							{:else}
								<span class="result-display-name">@{user.username}</span>
							{/if}
						</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	.nav-user-search {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: stretch;
	}

	.search-input {
		display: flex;
		flex: 1;
		align-items: center;
		gap: spacing.$unit-half;
		padding: 0 calc(spacing.$unit * 1.5);
		color: var(--menu-text);

		input {
			flex: 1;
			min-width: 0;
			background: transparent;
			border: none;
			outline: none;
			color: inherit;
			font-family: var(--font-family);
			font-size: typography.$font-tiny;
			font-weight: typography.$medium;
			padding: 0;

			&::placeholder {
				color: var(--menu-text);
				opacity: 0.6;
			}
		}
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: layout.$full-corner;
		padding: spacing.$unit-half;
		cursor: pointer;
		color: var(--menu-text);
		opacity: 0.7;

		&:hover {
			opacity: 1;
			background-color: var(--menu-bg-item-hover);
		}
	}

	.search-results {
		@include dropdown.dropdown-content;
		position: absolute;
		top: calc(100% + #{spacing.$unit-half});
		left: 0;
		right: 0;
		min-width: 240px;
		padding: spacing.$unit-half;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.search-empty {
		padding: spacing.$unit spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--menu-text);
		opacity: 0.6;
		text-align: center;
	}

	.search-result {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		width: 100%;
		padding: spacing.$unit-half spacing.$unit;
		background: transparent;
		border: none;
		border-radius: layout.$input-corner;
		cursor: pointer;
		text-align: left;
		font-family: var(--font-family);
		color: var(--menu-text);

		&.active {
			background-color: var(--menu-bg-item-hover);
		}
	}

	@each $el in $elements {
		.nav-user-search.#{$el} .search-result.active {
			background-color: var(--#{$el}-nav-selected-bg);
			color: var(--#{$el}-nav-selected-text);
		}
	}

	.result-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.avatar-placeholder {
		background-color: var(--menu-bg);
		display: block;
	}

	.result-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.result-display-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-username {
		font-size: typography.$font-tiny;
		opacity: 0.7;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
