<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'

	const { children }: { children: () => any } = $props()

	const tabs = [
		{ value: 'about', path: '/about' },
		{ value: 'updates', path: '/about/updates' },
		{ value: 'roadmap', path: '/about/roadmap' }
	] as const

	const activeTab = $derived(
		tabs.findLast((tab) => page.url.pathname.startsWith(tab.path))?.value ?? 'about'
	)

	function handleTabChange(value: string) {
		const tab = tabs.find((t) => t.value === value)
		if (tab) goto(tab.path)
	}
</script>

<div class="about-layout">
	{#if activeTab === 'about'}
		<div class="about-card">
			<div class="about-hero">
				<img src="https://siero-img.s3-us-west-2.amazonaws.com/about-hero.jpg" alt="" />
			</div>
			<nav class="about-nav">
				<SegmentedControl
					value={activeTab}
					onValueChange={handleTabChange}
					variant="background"
					size="small"
					grow
				>
					<Segment value="about">{m.about_tab_about()}</Segment>
					<Segment value="updates">{m.about_tab_updates()}</Segment>
					<Segment value="roadmap">{m.about_tab_roadmap()}</Segment>
				</SegmentedControl>
			</nav>
			<div class="about-intro">
				<h2>
					{m.about_subtitle_before_cygames()}<a
						href="https://www.cygames.co.jp/"
						target="_blank"
						rel="noopener noreferrer">Cygames</a
					>{m.about_subtitle_after_cygames()}
				</h2>
				<p>{m.about_explanation_0()}</p>
				<p>{m.about_explanation_1()}</p>
			</div>
		</div>
		{@render children?.()}
	{:else}
		<div class="about-card">
			<div class="about-hero">
				<img src="https://siero-img.s3-us-west-2.amazonaws.com/about-hero.jpg" alt="" />
			</div>
			<nav class="about-nav">
				<SegmentedControl
					value={activeTab}
					onValueChange={handleTabChange}
					variant="background"
					size="small"
					grow
				>
					<Segment value="about">{m.about_tab_about()}</Segment>
					<Segment value="updates">{m.about_tab_updates()}</Segment>
					<Segment value="roadmap">{m.about_tab_roadmap()}</Segment>
				</SegmentedControl>
			</nav>
			<div class="about-content">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.about-layout {
		max-width: var(--main-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		:global(h1),
		:global(h2),
		:global(h3),
		:global(h4),
		:global(p),
		:global(ul) {
			margin: 0;
		}
	}

	.about-card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		overflow: hidden;
	}

	.about-hero {
		position: relative;
		padding: $unit-2x $unit-2x 0;

		img {
			display: block;
			width: 100%;
			height: auto;
			object-fit: cover;
			object-position: center 40%;
			border-radius: $input-corner;
		}

		&::after {
			content: '';
			position: absolute;
			top: $unit-2x;
			left: $unit-2x;
			right: $unit-2x;
			bottom: 0;
			border-radius: $input-corner;
			box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.25);
			pointer-events: none;
		}
	}

	.about-nav {
		display: flex;
		justify-content: center;
		padding: $unit-2x;
	}

	.about-intro {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit-3x $unit-3x;

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
	}

	.about-content {
		padding: $unit $unit-3x $unit-3x;
		color: var(--text-primary);
	}
</style>
