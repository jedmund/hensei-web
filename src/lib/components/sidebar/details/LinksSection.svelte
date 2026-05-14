<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import { getProfileIcon } from '$lib/utils/images'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl,
		type EntityType
	} from '$lib/utils/external-links'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: EntityType
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data from API
		itemData: any
	}

	let { type, itemData }: Props = $props()

	type LinkChip = {
		key: 'wiki_en' | 'wiki_ja' | 'gamewith' | 'kamigame'
		label: string
		href: string
		/** Path to an image icon, or undefined to fall back to the link icon. */
		iconSrc?: string
	}

	const links = $derived.by((): LinkChip[] => {
		if (!itemData) return []

		const wikiEn = buildWikiEnUrl(itemData.wiki?.en)
		const wikiJa = buildWikiJaUrl(itemData.wiki?.ja, type)
		const gamewith = buildGamewithUrl(itemData.gamewith)
		const kamigame = buildKamigameUrl(itemData.kamigame, type, itemData.rarity)

		const chips: Record<LinkChip['key'], LinkChip | null> = {
			wiki_en: wikiEn ? { key: 'wiki_en', label: m.details_link_wiki_en(), href: wikiEn } : null,
			wiki_ja: wikiJa ? { key: 'wiki_ja', label: m.details_link_wiki_ja(), href: wikiJa } : null,
			gamewith: gamewith
				? {
						key: 'gamewith',
						label: m.details_link_gamewith(),
						href: gamewith,
						iconSrc: getProfileIcon('gamewith')
					}
				: null,
			kamigame: kamigame
				? {
						key: 'kamigame',
						label: m.details_link_kamigame(),
						href: kamigame,
						iconSrc: getProfileIcon('kamigame')
					}
				: null
		}

		// Order surfaces the most-likely-useful resource first per locale.
		const order: LinkChip['key'][] =
			getLocale() === 'ja'
				? ['gamewith', 'kamigame', 'wiki_ja', 'wiki_en']
				: ['wiki_en', 'gamewith', 'kamigame', 'wiki_ja']

		return order.map((key) => chips[key]).filter((c): c is LinkChip => c !== null)
	})
</script>

{#if links.length > 0}
	<ul class="link-chips">
		{#each links as link (link.key)}
			<li>
				<a class="chip" href={link.href} target="_blank" rel="noopener noreferrer">
					<span class="icon">
						{#if link.iconSrc}
							<img src={link.iconSrc} alt="" />
						{:else}
							<Icon name="link" size={14} />
						{/if}
					</span>
					<span class="label">{link.label}</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.link-chips {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
		padding: 0 spacing.$unit-2x;
		margin: 0;
		list-style: none;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-three-quarter;
		padding: spacing.$unit-three-quarter calc(spacing.$unit * 1.5);
		border-radius: layout.$full-corner;
		background: var(--button-bg);
		color: var(--text-primary);
		font-size: typography.$font-button;
		font-weight: typography.$medium;
		text-decoration: none;
		transition:
			background 0.15s,
			transform 0.15s;

		&:hover {
			background: var(--button-bg-hover, var(--button-bg));
			transform: translateY(-1px);
		}
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			display: block;
			border-radius: layout.$item-corner-small;
		}
	}

	.label {
		line-height: 1;
	}
</style>
