<script lang="ts">
	// An awakening list row's icon
	import type { AdminAwakeningRow } from '$lib/types/api/admin'
	import { getAwakeningIcon } from '$lib/utils/images/icons'

	const { row }: { row: AdminAwakeningRow } = $props()
</script>

<div class="image-cell">
	<img src={getAwakeningIcon(row.slug)} alt={row.nameEn} class="icon" />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: spacing.$unit-half;
	}

	.icon {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
</style>
