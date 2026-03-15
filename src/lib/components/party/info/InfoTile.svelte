<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		label?: string
		clickable?: boolean
		onclick?: () => void
		/** Show a + button in the header */
		showAdd?: boolean
		/** Callback when + button or header is clicked */
		onAdd?: () => void
		/** Optional snippet rendered to the right of the header label */
		headerAction?: Snippet
		class?: string
		children: Snippet
	}

	let { label, clickable = false, onclick, showAdd = false, onAdd, headerAction, class: className = '', children }: Props = $props()
</script>

<div
	class="info-tile {className}"
	class:clickable
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
	onclick={clickable ? onclick : undefined}
	onkeydown={clickable ? (e) => e.key === 'Enter' && onclick?.() : undefined}
>
	{#if label}
		<div class="tile-header" class:has-action={headerAction || (showAdd && onAdd)}>
			{#if showAdd && onAdd}
				<button type="button" class="tile-header-button" onclick={onAdd}>
					<h3 class="tile-label">{label}</h3>
					<Icon name="plus" size={16} class="add-icon" />
				</button>
			{:else}
				<h3 class="tile-label">{label}</h3>
				{#if headerAction}
					{@render headerAction()}
				{/if}
			{/if}
		</div>
	{/if}
	<div class="tile-content">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.info-tile {
		background: var(--card-bg);
		border: 0.5px solid var(--button-bg);
		border-radius: $card-corner;
		padding: $unit $unit-2x $unit-2x $unit-2x;
		display: flex;
		flex-direction: column;
		gap: $unit;

		&.clickable {
			cursor: pointer;
			@include smooth-transition($duration-quick, box-shadow, transform);

			&:hover {
				box-shadow:
					0 0 0 1px rgba(0, 0, 0, 0.01),
					$card-elevation-hover;
			}

			&:active {
				transform: scale(0.99);
			}
		}

		.tile-header {
			display: flex;
			align-items: center;
			min-height: 30px;

			&.has-action {
				justify-content: space-between;
			}
		}

		.tile-label {
			font-size: $font-small;
			font-weight: $medium;
			color: var(--text-secondary);
			margin: 0;
		}

		.tile-header-button {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: 0;
			background: none;
			border: none;
			cursor: pointer;

			&:hover {
				.tile-label {
					color: var(--text-primary);
				}

				:global(.add-icon) {
					color: var(--text-primary);
				}
			}
		}

		:global(.add-icon) {
			color: var(--icon-secondary);
			flex-shrink: 0;
		}

		.tile-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}
</style>
