<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	const features = [
		{
			title: m.ext_feature_sync_title(),
			description: m.ext_feature_sync_desc()
		},
		{
			title: m.ext_feature_passive_title(),
			description: m.ext_feature_passive_desc()
		},
		{
			title: m.ext_feature_privacy_title(),
			description: m.ext_feature_privacy_desc()
		}
	]

	const steps = [
		m.ext_step_1(),
		m.ext_step_2(),
		m.ext_step_3()
	]
</script>

<PageMeta title={m.page_title_extension()} description={m.page_desc_extension()} />

<div class="extension-page">
	<div class="hero card">
		<h1>{m.ext_title()}</h1>
		<p class="subtitle">{m.ext_subtitle()}</p>
		<p>{m.ext_description()}</p>
		<a
			href="https://github.com/jedmund/hensei-extractor/releases/latest/download/granblue-team-extension.zip"
			class="download-link"
		>
			<Button size="large">{m.ext_download()}</Button>
		</a>
	</div>

	<div class="card">
		<h2>{m.ext_features_title()}</h2>
		<div class="features">
			{#each features as feature (feature.title)}
				<div class="feature">
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="card">
		<h2>{m.ext_install_title()}</h2>
		<ol class="steps">
			{#each steps as step, i (i)}
				<li>{@html step}</li>
			{/each}
		</ol>
	</div>

	<div class="card">
		<h2>{m.ext_requirements_title()}</h2>
		<ul class="requirements">
			<li>{m.ext_req_browser()}</li>
			<li>{m.ext_req_account()}</li>
		</ul>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/mixins' as *;

	.extension-page {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
	}

	.card {
		background: var(--card-bg);
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		h1,
		h2 {
			font-weight: $bold;
			font-size: $font-medium;
			margin: 0;
		}

		p {
			font-size: $font-medium;
			line-height: 1.35;
			margin: 0;
		}
	}

	.hero {
		.subtitle {
			font-weight: $bold;
		}
	}

	.download-link {
		display: inline-block;
		text-decoration: none;
		width: fit-content;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: $unit-3x;

		@include breakpoint(tablet) {
			grid-template-columns: 1fr;
		}
	}

	.feature {
		h3 {
			font-weight: $bold;
			font-size: $font-regular;
			margin: 0;
		}

		p {
			font-size: $font-body;
			line-height: 1.4;
			color: var(--text-secondary);
			margin: 0;
		}
	}

	.steps {
		padding-left: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		li {
			font-size: $font-medium;
			line-height: 1.4;
		}

		:global(code) {
			background: var(--button-bg);
			padding: 2px $unit;
			border-radius: $item-corner-small;
			font-size: $font-small;
		}
	}

	.requirements {
		padding-left: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit;

		li {
			font-size: $font-medium;
			line-height: 1.4;
		}
	}
</style>
