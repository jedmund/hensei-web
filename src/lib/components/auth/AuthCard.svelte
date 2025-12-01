<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		children: Snippet
		footer?: Snippet
	}

	let { title, children, footer }: Props = $props()
</script>

<div class="authCard">
	<h1 class="title">{title}</h1>
	<div class="content">
		{@render children()}
	</div>
	{#if footer}
		<div class="footer">
			{@render footer()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;

	.authCard {
		background: var(--card-bg);
		border-radius: $card-corner;
		box-shadow: $dialog-elevation;
		padding: $unit-4x;
		width: 100%;
	}

	.title {
		color: var(--text-primary);
		font-size: $font-xlarge;
		font-weight: $bold;
		margin: 0 0 $unit-3x;
		text-align: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.footer {
		margin-top: $unit-3x;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-small;

		:global(a) {
			color: var(--accent-blue);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
