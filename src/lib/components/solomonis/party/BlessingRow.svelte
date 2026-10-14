<script lang="ts">
	/**
	 * One blessing in a list: icon, name and cost on the left, a control or
	 * value on the right (`trailing`), and what it does underneath. Shared by
	 * the details pane (level) and the blessing picker (level stepper).
	 */
	import type { Snippet } from 'svelte'
	import BlessingName from './BlessingName.svelte'

	interface Props {
		slug: string
		name: string
		subtitle: string
		description?: string | null
		/** Mute the description, e.g. a preview of level 1 for an unequipped blessing */
		descriptionMuted?: boolean
		trailing: Snippet
	}

	let { slug, name, subtitle, description, descriptionMuted = false, trailing }: Props = $props()
</script>

<div class="blessing-row">
	<div class="row">
		<BlessingName {slug} {name} {subtitle} size="large" />
		{@render trailing()}
	</div>
	{#if description}
		<p class="effect" class:muted={descriptionMuted}>{description}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.blessing-row {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.effect {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);

		&.muted {
			color: var(--text-tertiary);
		}
	}
</style>
