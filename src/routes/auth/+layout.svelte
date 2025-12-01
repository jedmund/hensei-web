<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="authContainer">
	<div class="authBackground"></div>
	<div class="authContent">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;

	.authContainer {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.authBackground {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		background-size: cover;
		background-position: center;
		z-index: 0;

		// Overlay for readability
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: rgba(0, 0, 0, 0.3);
		}
	}

	.authContent {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 420px;
		margin: $unit-2x;
	}
</style>
