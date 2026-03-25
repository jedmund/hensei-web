<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getBasePath } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()

	const backgroundUrl = `${getBasePath()}/port-breeze.jpg`
</script>

<div class="authContainer" style:--auth-bg-url="url('{backgroundUrl}')">
	<div class="authBackground"></div>
	<a href={localizeHref('/')} class="backLink">
		<Icon name="arrow-left" size={14} />
		{m.auth_backToHome()}
	</a>
	<div class="authContent">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

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
		background: #1a1a2e var(--auth-bg-url) center / cover no-repeat;
		z-index: $z-base;

		// Overlay for readability
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: rgba(0, 0, 0, 0.4);
		}
	}

	.backLink {
		position: absolute;
		top: $unit-3x;
		left: $unit-3x;
		z-index: $z-badge;
		display: flex;
		align-items: center;
		gap: $unit;
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-size: $font-small;
		padding: $unit $unit-2x;
		border-radius: $unit;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		transition: background 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.5);
		}
	}

	.authContent {
		position: relative;
		z-index: $z-raised;
		width: 100%;
		max-width: 420px;
		margin: $unit-2x;
	}
</style>
