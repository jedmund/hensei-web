<svelte:options runes={true} />

<script lang="ts">
	export interface ImageItem {
		url: string
		label: string
		variant: string
		pose?: string
	}

	interface Props {
		images: ImageItem[]
	}

	let { images }: Props = $props()
</script>

<div class="images-tab">
	<div class="images-grid">
		{#each images as image}
			<div class="image-item">
				<a href={image.url} target="_blank" rel="noopener noreferrer">
					<img src={image.url} alt={image.label} loading="lazy" />
				</a>
				<span class="image-label">{image.label}</span>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.images-tab {
		padding: spacing.$unit-2x;
	}

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: spacing.$unit-2x;
	}

	.image-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;

		a {
			display: block;
			border-radius: layout.$item-corner;
			overflow: hidden;
			transition: transform 0.2s ease;

			&:hover {
				transform: scale(1.02);
			}
		}

		img {
			display: block;
			max-width: 100%;
			height: auto;
			background: colors.$grey-90;
		}
	}

	.image-label {
		font-size: typography.$font-small;
		color: colors.$grey-40;
		text-align: center;
	}
</style>
