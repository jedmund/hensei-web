<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		label?: string
		clickable?: boolean
		onclick?: () => void
		class?: string
		children: Snippet
	}

	let { label, clickable = false, onclick, class: className = '', children }: Props = $props()
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
		<h3 class="tile-label">{label}</h3>
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
		padding: $unit-2x;
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

		.tile-label {
			font-size: $font-small;
			font-weight: $medium;
			color: var(--text-secondary);
			margin: 0;
		}

		.tile-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}
</style>
