<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** The crew's id in the game */
		granblueCrewId: string
	}

	const { granblueCrewId }: Props = $props()
</script>

<Tooltip content={m.crew_ingame()}>
	<a
		href={`https://game.granbluefantasy.jp/#guild/detail/${granblueCrewId}`}
		target="_blank"
		rel="noopener noreferrer"
		class="crew-profile-link"
	>
		<Icon name="sword" size={24} />
	</a>
</Tooltip>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;

	.crew-profile-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: layout.$card-corner;
		color: var(--text-secondary);
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

		:global(svg) {
			stroke-width: 2px;
		}

		&:hover {
			background: var(--button-contained-bg-hover, colors.$grey-90);
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}
</style>
