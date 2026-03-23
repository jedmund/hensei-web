<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import LinkItem from '$lib/components/about/LinkItem.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getBasePath } from '$lib/utils/images'
</script>

<PageMeta title={m.page_title_about()} description={m.page_desc_about()} />

<div class="about-card">
	<h2>{m.about_feedback_title()}</h2>
	<p>{m.about_feedback_explanation()}</p>
	<p>{m.about_feedback_solicit()}</p>
	<LinkItem title="granblue-tools" link="https://discord.gg/pSjUAYNDzN" icon="discord" class="discord" />
</div>

<div class="about-card">
	<h2>{m.about_contributing_title()}</h2>
	<p>{m.about_contributing_explanation()}</p>
	<LinkItem title="jedmund/hensei-web" link="https://github.com/jedmund/hensei-web" icon="github" class="github" />
	<LinkItem title="jedmund/hensei-api" link="https://github.com/jedmund/hensei-api" icon="github" class="github" />
	<LinkItem title="jedmund/hensei-extractor" link="https://github.com/jedmund/hensei-extractor" icon="github" class="github" />
</div>

<div class="about-card">
	<h2>{m.about_credits_title()}</h2>
	<p>{m.about_credits_maintainer_before()}<a href="https://jedmund.com" target="_blank" rel="noreferrer">@jedmund</a>{m.about_credits_maintainer_after()}</p>
	<p>{m.about_credits_thanks()}</p>
	<p>{m.about_credits_special_thanks()}</p>
</div>

<div class="about-card">
	<h2>{m.about_data_title()}</h2>
	<p>{m.about_data_explanation()}</p>
	<ul class="data-sources">
		<li>
			<img src="{getBasePath()}/external/gbf-wiki-en.png" alt="" width="16" height="16" />
			<a href="https://gbf.wiki" target="_blank" rel="noreferrer">gbf.wiki</a>
		</li>
		<li>
			<img src="{getBasePath()}/external/gbf-wiki-jp.png" alt="" width="16" height="16" />
			<a href="https://gbf-wiki.com/" target="_blank" rel="noreferrer">gbf-wiki</a>
		</li>
		<li>
			<img src="{getBasePath()}/external/kamigame.png" alt="" width="16" height="16" />
			<a href="https://kamigame.jp/%E3%82%B0%E3%83%A9%E3%83%96%E3%83%AB/index.html" target="_blank" rel="noreferrer">Kamigame</a>
		</li>
		<li>
			<img src="{getBasePath()}/external/gamewith.png" alt="" width="16" height="16" />
			<a href="https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/" target="_blank" rel="noreferrer">Gamewith</a>
		</li>
	</ul>
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
			color: var(--text-primary);
		}

		p {
			font-size: $font-medium;
			line-height: 1.35;
			color: var(--text-primary);
		}

		a {
			color: var(--accent-blue);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		.data-sources {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: $unit;

			li {
				display: flex;
				align-items: center;
				gap: $unit;
				font-size: $font-medium;
				line-height: 1.35;

				img {
					flex-shrink: 0;
				}
			}
		}
	}
</style>
