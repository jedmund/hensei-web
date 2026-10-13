<script lang="ts">
	/** A blessing's round icon and name, with an optional subtitle, for list rows. */
	import { getBlessingImage } from '$lib/utils/images'

	interface Props {
		slug: string
		name: string
		subtitle?: string
		size?: 'small' | 'large'
	}

	let { slug, name, subtitle, size = 'small' }: Props = $props()
</script>

<span class="blessing-name {size}">
	<img src={getBlessingImage(slug, 'icon')} alt="" class="icon" loading="lazy" />
	<span class="text">
		<span class="name">{name}</span>
		{#if subtitle}
			<span class="subtitle">{subtitle}</span>
		{/if}
	</span>
</span>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.blessing-name {
		display: inline-flex;
		align-items: center;
		gap: $unit;
	}

	.icon {
		flex-shrink: 0;
	}

	.small .icon {
		width: $unit-4x;
		height: $unit-4x;
	}

	.large .icon {
		width: $unit-6x;
		height: $unit-6x;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.large .name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: $font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
</style>
