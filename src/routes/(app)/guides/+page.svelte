
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
</script>

<svelte:head>
	<title>{m.page_title_guides()}</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="empty-content">
			<p class="description">{m.guides_coming_soon()}</p>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.empty-content {
		padding: spacing.$unit-3x spacing.$unit-2x;
		text-align: center;

		.description {
			color: var(--text-primary);
			font-size: typography.$font-small;
			line-height: 1.5;
			max-width: 360px;
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
