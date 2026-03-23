<script lang="ts">
	import { page } from '$app/state'
	import { Accordion } from 'bits-ui'
	import LinkItem from '$lib/components/about/LinkItem.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { UserCookie } from '$lib/types/UserCookie'

	const faqItems = [
		{ value: 'how', title: () => m.ext_faq_how_title(), desc: () => m.ext_faq_desc() },
		{ value: 'safe', title: () => m.ext_faq_safe_title(), desc: () => m.ext_faq_safe_desc() },
		{ value: 'ban', title: () => m.ext_faq_ban_title(), desc: () => m.ext_faq_ban_desc() },
		{ value: 'install', title: () => m.ext_faq_install_title(), desc: () => m.ext_faq_install_desc() }
	]

	const currentUser = $derived(page.data?.currentUser as UserCookie | null)
	const userElement = $derived(
		(currentUser?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light') ?? undefined
	)
</script>

<PageMeta title={m.page_title_extension()} description={m.page_desc_extension()} />

<div class="extension-page">
	<div class="hero card">
		<video class="hero-video" autoplay loop muted playsinline>
			<source src="/images/media/extension.mp4" type="video/mp4" />
		</video>
		<p>{m.ext_description()}</p>
		<a
			href="https://github.com/jedmund/hensei-extractor/releases/latest/download/granblue-team-extension.zip"
			class="download-link"
		>
			<Button size="large" element={userElement} elementStyle={!!userElement}>
				{m.ext_download()}
			</Button>
		</a>
		<p class="fine-print">{m.ext_compatibility()}</p>
	</div>

	<div class="feature-cards">
		<div class="card">
			<h2>{m.ext_feature_collection_title()}</h2>
			<p>{m.ext_feature_collection_desc()}</p>
		</div>
		<div class="card">
			<h2>{m.ext_feature_parties_title()}</h2>
			<p>{m.ext_feature_parties_desc()}</p>
		</div>
	</div>

	<div class="card">
		<h2>{m.ext_faq_title()}</h2>
		<Accordion.Root
			type="single"
			style={userElement ? `--faq-accent: var(--${userElement}-button-bg)` : undefined}
		>
			{#each faqItems as item}
				<Accordion.Item value={item.value}>
					<Accordion.Header>
						<Accordion.Trigger class="faq-trigger">
							{item.title()}
							<span class="faq-icon"></span>
						</Accordion.Trigger>
					</Accordion.Header>
					<Accordion.Content class="faq-content">
						<p class="faq-answer">{@html item.desc()}</p>
						{#if item.value === 'safe'}
							<LinkItem
								title="hensei-extractor"
								link="https://github.com/jedmund/hensei-extractor"
								icon="github"
								class="github"
							/>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
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
		color: var(--text-primary);
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

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
		align-items: center;
	}

	.hero-video {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: $card-corner;
		object-fit: cover;
	}

	.download-link {
		display: inline-block;
		text-decoration: none;
		width: fit-content;
	}

	.fine-print {
		font-size: $font-small !important;
		color: var(--text-secondary);
	}

	.feature-cards {
		display: flex;
		gap: $unit-3x;

		@include breakpoint(tablet) {
			flex-direction: column;
		}

		.card {
			flex: 1;
		}
	}

	:global(.faq-trigger) {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: $unit-2x 0;
		font-size: $font-medium;
		font-weight: $bold;
		cursor: pointer;
		border-top: 1px solid var(--border);
		transition: color 0.15s ease;
	}

	:global(.faq-trigger:hover),
	:global(.faq-trigger[data-state='open']) {
		color: var(--faq-accent, var(--text-secondary));
	}

	:global(.faq-trigger:first-of-type) {
		border-top: none;
	}

	.faq-icon {
		position: relative;
		width: 16px;
		height: 16px;
		flex-shrink: 0;

		&::before,
		&::after {
			content: '';
			position: absolute;
			background: currentColor;
			border-radius: 1px;
		}

		&::before {
			top: 50%;
			left: 0;
			width: 100%;
			height: 2px;
			transform: translateY(-50%);
		}

		&::after {
			top: 0;
			left: 50%;
			width: 2px;
			height: 100%;
			transform: translateX(-50%);
			transition: transform 0.2s ease;
		}
	}

	:global([data-state='open'] .faq-icon)::after {
		transform: translateX(-50%) rotate(90deg);
	}

	:global(.faq-content) {
		overflow: hidden;

		&:global([data-state='open']) {
			animation: slideDown 0.2s ease;
		}

		&:global([data-state='closed']) {
			animation: slideUp 0.2s ease;
		}
	}

	:global(.faq-answer) {
		padding-bottom: $unit-2x;
		font-size: $font-medium;
		line-height: 1.5;
		margin: 0;

		:global(code) {
			background: var(--button-bg);
			padding: 2px $unit;
			border-radius: $item-corner-small;
			font-size: $font-small;
		}

		:global(ol) {
			padding-left: $unit-3x;
			display: flex;
			flex-direction: column;
			gap: $unit-2x;
			margin: 0;
		}

		:global(li) {
			line-height: 1.4;
		}
	}

	@keyframes slideDown {
		from {
			height: 0;
		}
		to {
			height: var(--bits-accordion-content-height);
		}
	}

	@keyframes slideUp {
		from {
			height: var(--bits-accordion-content-height);
		}
		to {
			height: 0;
		}
	}

</style>
