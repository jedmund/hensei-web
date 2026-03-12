<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import LinkItem from '$lib/components/about/LinkItem.svelte'
	import * as m from '$lib/paraglide/messages'
</script>

<PageMeta title={m.page_title_about()} description={m.page_desc_about()} />

<div class="about-card">
	<h2>{m.about_feedback_title()}</h2>
	<p>{m.about_feedback_explanation()}</p>
	<p>{m.about_feedback_solicit()}</p>
	<LinkItem title="granblue-tools" link="https://discord.gg/qyZ5hGdPC8" icon="discord" class="discord" />
</div>

<div class="about-card">
	<h2>{m.about_contributing_title()}</h2>
	<p>{m.about_contributing_explanation()}</p>
	<LinkItem title="jedmund/hensei-web" link="https://github.com/jedmund/hensei-web" icon="github" class="github" />
</div>

<div class="about-card">
	<h2>{m.about_credits_title()}</h2>
	<p>{m.about_credits_maintainer()}</p>
	<p>{m.about_credits_assistance()}</p>
	<p>{m.about_credits_support()}</p>
</div>

<div class="about-card">
	<h2>{m.about_license_title()}</h2>
	<p>{m.about_license_text()}</p>
	<p>{m.about_license_explanation()}</p>
	<h2>{m.about_copyright_title()}</h2>
	<p>{m.about_copyright_explanation()}</p>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.about-card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		h2 {
			font-weight: $bold;
			font-size: $font-medium;
		}

		p {
			font-size: $font-medium;
			line-height: 1.35;
		}
	}
</style>
