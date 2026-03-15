<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	const roadmapItems = [
		{
			title: m.about_roadmap_item_data_display_title,
			description: m.about_roadmap_item_data_display_desc
		},
		{
			title: m.about_roadmap_item_curation_title,
			description: m.about_roadmap_item_curation_desc
		},
		{
			title: m.about_roadmap_item_embeds_title,
			description: m.about_roadmap_item_embeds_desc
		},
		{
			title: m.about_roadmap_item_feedback_title,
			description: m.about_roadmap_item_feedback_desc
		},
		{
			title: m.about_roadmap_item_substitutions_title,
			description: m.about_roadmap_item_substitutions_desc
		},
		{
			title: m.about_roadmap_item_calculator_title,
			description: m.about_roadmap_item_calculator_desc
		},
		{
			title: m.about_roadmap_item_rotations_title,
			description: m.about_roadmap_item_rotations_desc
		},
		{
			title: m.about_roadmap_item_guides_title,
			description: m.about_roadmap_item_guides_desc
		}
	]
</script>

<PageMeta title={m.page_title_roadmap()} description={m.page_desc_roadmap()} />

<div class="roadmap">
	<p>{m.about_roadmap_intro()}</p>
	<ul>
		{#each roadmapItems as item (item.title)}
			<li>
				<h4>{item.title()}</h4>
				<p>{item.description()}</p>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.roadmap {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;

		> p {
			font-size: $font-medium;
			line-height: 1.35;
			color: var(--text-primary);
		}

		ul {
			list-style-type: none;
			display: grid;
			grid-template-columns: 1fr;
			gap: $unit-3x;
			padding: 0;

			li {
				display: flex;
				flex-direction: column;
				gap: $unit-half;

				h4 {
					font-size: $font-medium;
					font-weight: $bold;
					color: var(--text-primary);
				}

				p {
					font-size: $font-medium;
					line-height: 1.35;
					color: var(--text-secondary);
				}
			}
		}
	}
</style>
