<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import LinkItem from '$lib/components/about/LinkItem.svelte'
	import * as m from '$lib/paraglide/messages'

	const roadmapItems = [
		{
			title: 'Account promotion',
			description:
				'Users that have created teams without an account will be able to create an account and retain access to all of their teams'
		},
		{
			title: 'Better filters',
			description:
				"You'll be able to filter by team parameters like Full Auto or how many button clicks, and also filter out teams with no name, teams from anonymous users, and so on"
		},
		{
			title: 'Private and Unlisted teams',
			description:
				'If you just want to make a team for your own memo or to share with your crew and no one else, this update is for you'
		},
		{
			title: 'Mention items',
			description:
				'This update will allow you to mention individual items, like @Ixaba or @Charlotta (Grand), to give more context or suggest substitutions in your team descriptions.'
		},
		{
			title: 'Markdown in team descriptions',
			description:
				"If you're writing a lot of text in the description box, this update will give you tools to format it better"
		},
		{
			title: 'Embed tweets in team descriptions',
			description:
				'Similar to embedding Youtube videos, this update will allow you to paste the link to a tweet and have it automatically embed in the description'
		}
	]
</script>

<PageMeta title={m.page_title_roadmap()} description={m.page_desc_roadmap()} />

<div class="roadmap">
	<h1>{m.about_tab_roadmap()}</h1>

	<div class="notes">
		<p>{m.about_roadmap_link_intro()}</p>
	</div>

	<div>
		<LinkItem
			title={m.about_roadmap_link_title()}
			link="https://github.com/users/jedmund/projects/1"
		/>
	</div>

	<ul>
		{#each roadmapItems as item (item.title)}
			<li>
				<h4>{item.title}</h4>
				<p>{item.description}</p>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.roadmap {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;

		.notes {
			display: flex;
			flex-direction: column;
			gap: $unit;

			p {
				font-size: $font-medium;
			}
		}

		ul {
			color: var(--text-primary);
			list-style-type: none;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: $unit-3x;
			padding: 0;

			li {
				display: flex;
				flex-direction: column;
				gap: $unit;

				h4 {
					font-size: $font-medium;
					font-weight: $bold;
				}

				p {
					font-size: $font-regular;
				}
			}
		}
	}
</style>
