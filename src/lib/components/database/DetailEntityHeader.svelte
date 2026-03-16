<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		imageUrl: string
		name: string
		imageSize?: number
		meta?: Snippet | undefined
	}

	let { imageUrl, name, imageSize = 64, meta }: Props = $props()
</script>

<header class="detail-header">
	<div class="detail-header-left">
		<div class="entity-image">
			<img src={imageUrl} alt={name} width={imageSize} />
		</div>
		<div class="detail-header-info">
			<h2>{name}</h2>
			{#if meta}
				<div class="meta">
					{@render meta()}
				</div>
			{/if}
		</div>
	</div>
</header>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.detail-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.detail-header-left {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.entity-image img {
		height: auto;
		border-radius: layout.$item-corner;
	}

	.detail-header-info h2 {
		font-size: typography.$font-xlarge;
		font-weight: typography.$bold;
		margin: 0 0 spacing.$unit 0;
		color: var(--text-primary);
	}

	.meta {
		display: flex;
		flex-direction: row;
		gap: spacing.$unit;
		align-items: center;
	}

	@media (max-width: 768px) {
		.detail-header {
			flex-direction: column;
		}

		.detail-header-left {
			flex-direction: column;
		}

		.entity-image img {
			width: 48px;
		}
	}
</style>
