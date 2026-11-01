<script lang="ts">
	import { Combobox } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import ScoutAvatar from '$lib/components/crew/scout/ScoutAvatar.svelte'
	import type { ScoutUserSearch } from '$lib/features/crew/scoutUserSearch.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		search: ScoutUserSearch
		/** A user was picked from the results */
		onSelect: (userId: string) => void
	}

	const { search, onSelect }: Props = $props()
</script>

<Combobox.Root
	type="single"
	bind:value={search.selectedUserId}
	onValueChange={onSelect}
	bind:open={search.comboboxOpen}
	inputValue={search.inputValue}
	items={search.comboboxItems}
>
	<div class="combobox-input-wrapper">
		<Combobox.Input
			class="combobox-input"
			placeholder={m.crew_scout_search()}
			oninput={(e) => search.handleInput(e.currentTarget.value)}
		/>
		{#if search.isLoading}
			<span class="input-loading">
				<Icon name="loader-2" size={14} />
			</span>
		{/if}
	</div>

	<Combobox.Portal>
		<Combobox.Content class="combobox-content">
			<Combobox.Viewport>
				{#each search.searchResults as user (user.id)}
					<Combobox.Item value={user.id} label={user.username} class="combobox-item">
						{#snippet children({ selected })}
							<ScoutAvatar picture={user.avatar?.picture} alt="" />
							<span class="item-label">{user.username}</span>
							{#if selected}
								<span class="item-check">
									<Icon name="check" size={14} />
								</span>
							{/if}
						{/snippet}
					</Combobox.Item>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	// Input wrapper — matches Input component's contained style
	.combobox-input-wrapper {
		position: relative;
	}

	:global(.combobox-input) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bound-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		font-size: $font-regular;
		min-height: $unit-4x;
		padding: $unit calc($unit * 1.5);
		width: 100%;
		@include smooth-transition($duration-quick, background-color);

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background-color: var(--input-bound-bg-hover);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.input-loading {
		position: absolute;
		right: $unit-2x;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		pointer-events: none;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	// Dropdown — matches Select component's content style
	:global(.combobox-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: var(--bits-combobox-anchor-width, var(--bits-select-anchor-width));
		max-height: 40vh;
		overflow: auto;
		z-index: $z-modal + 2;
		animation: fadeIn $duration-opacity-fade ease-out;
	}

	// Items — matches Select component's item style
	:global(.combobox-item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);

		&:hover,
		&[data-highlighted] {
			background-color: var(--option-bg-hover);
		}

		&[data-selected] {
			font-weight: $medium;
		}
	}

	.item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-check {
		margin-left: auto;
		color: var(--accent-color);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
