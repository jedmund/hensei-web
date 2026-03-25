<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		title: string
		link: string
		icon?: string
		class?: string
	}

	let { title, link, icon, class: className = '' }: Props = $props()
</script>

<a class="item {className}" href={link} target="_blank" rel="noreferrer">
	{#if icon}
		<Icon name={icon} size={24} />
	{/if}
	<h3>{title}</h3>
	<Icon name="link" size={14} />
</a>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.item {
		align-items: center;
		background: var(--dialog-bg);
		border: 1px solid var(--link-item-bg, var(--card-bg));
		border-radius: $card-corner;
		display: flex;
		gap: $unit-2x;
		padding: $unit-2x;
		text-decoration: none;
		color: var(--text-primary);
		transition:
			background $duration-zoom ease-in,
			transform $duration-zoom ease-in;

		&:hover {
			background: var(--link-item-hover-bg);
			color: var(--text-primary);
			text-decoration: none;
		}

		&.discord:hover :global(svg) {
			fill: #5865f2;
		}

		&.github:hover :global(svg) {
			fill: var(--text-primary);
		}

		h3 {
			flex: 1;
			margin: 0;
			font-weight: $bold;
			line-height: 1.3;
		}

		:global(svg) {
			fill: var(--link-item-image-color, var(--text-secondary));
			transition: fill $duration-zoom ease-in;
		}
	}
</style>
