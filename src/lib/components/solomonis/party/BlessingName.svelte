<script lang="ts">
	/** A blessing's round icon and name, for list rows. */
	import { getBlessingImage } from '$lib/utils/images'

	interface Props {
		slug: string
		name: string
	}

	let { slug, name }: Props = $props()
</script>

<span class="blessing-name">
	<img src={getBlessingImage(slug, 'icon')} alt="" class="icon" loading="lazy" />
	<span>{name}</span>
</span>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.blessing-name {
		display: inline-flex;
		align-items: center;
		gap: $unit;
	}

	.icon {
		width: $unit-4x;
		height: $unit-4x;
		flex-shrink: 0;
	}
</style>
