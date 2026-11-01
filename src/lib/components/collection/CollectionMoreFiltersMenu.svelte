<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import type { CollectionFilterConfig } from '$lib/types/filter'
	import { toggleFilterValue } from '$lib/utils/collectionFilterOptions'

	interface Props {
		/** Filter groups that overflow the inline row */
		filters: CollectionFilterConfig[]
	}

	let { filters }: Props = $props()
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="more-trigger">
		<span>{m.filter_more()}</span>
		<Icon name="chevron-down-small" size={14} />
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content class="more-menu-content" side="bottom" align="start" sideOffset={4}>
			{#each filters as filter (filter.key)}
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger class="more-menu-subtrigger">
						<span class="submenu-label">{filter.placeholder}</span>
						{#if filter.value.length > 0}
							<span class="selection-badge">{filter.value.length}</span>
						{/if}
						<Icon name="chevron-right-small" size={14} class="submenu-chevron" />
					</DropdownMenu.SubTrigger>

					<DropdownMenu.SubContent class="submenu-content">
						{#each filter.options as option (option.value)}
							{@const isSelected = filter.value.includes(option.value)}
							<DropdownMenu.Item
								class="submenu-item {isSelected ? 'selected' : ''}"
								onSelect={(e) => {
									e.preventDefault()
									filter.onChange(toggleFilterValue(filter.value, option.value))
								}}
							>
								{#if option.color}
									<span class="color-dot" style="background: {option.color}"></span>
								{/if}
								<span class="item-label" class:selected={isSelected}>{option.label}</span>
								{#if isSelected}
									<Icon name="check" size={14} class="check-icon" />
								{/if}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/effects' as *;

	// The menu renders in a portal, so its parts are styled through :global

	// More button trigger - matches MultiSelect trigger styling
	:global(.more-trigger) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit-half $unit;
		font-size: $font-small;
		font-family: var(--font-family);
		min-height: $unit-3x;
		color: var(--text-secondary);
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;

		&:hover {
			background-color: var(--input-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid $blue;
			outline-offset: 2px;
		}

		:global(svg) {
			flex-shrink: 0;
			color: var(--text-secondary);
		}
	}

	// More dropdown content
	:global(.more-menu-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: calc($unit * 18);
		z-index: $z-modal + 1;
		animation: fadeIn 0.15s ease-out;

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
	}

	// Submenu trigger
	:global(.more-menu-subtrigger) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit calc($unit * 1.5);
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-small;
		color: var(--text-primary);
		transition: background-color 0.1s ease;

		&:hover,
		&[data-highlighted] {
			background: var(--option-bg-hover);
		}

		.submenu-label {
			flex: 1;
		}

		.selection-badge {
			background: var(--accent-color, #{$blue});
			color: white;
			font-size: 11px;
			font-weight: $medium;
			padding: 2px 6px;
			border-radius: $full-corner;
			min-width: 18px;
			text-align: center;
		}

		:global(.submenu-chevron) {
			color: var(--text-tertiary);
			margin-left: auto;
		}
	}

	// Submenu content
	:global(.submenu-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: calc($unit * 16);
		max-height: 280px;
		overflow: auto;
		z-index: $z-modal + 2;
	}

	// Submenu items
	:global(.submenu-item) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit calc($unit * 1.5);
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-small;
		color: var(--text-primary);
		transition: background-color 0.1s ease;

		&:hover,
		&[data-highlighted] {
			background: var(--option-bg-hover);
		}

		&.selected {
			.item-label {
				font-weight: $medium;
			}
		}

		.color-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		.item-label {
			flex: 1;
		}

		:global(.check-icon) {
			color: var(--accent-color);
			margin-left: auto;
		}
	}
</style>
