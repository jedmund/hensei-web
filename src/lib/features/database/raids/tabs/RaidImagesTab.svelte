<script lang="ts">
	// The raid's art from the game's CDN, in every stored size, with downloads
	// to our bucket for editors. Each size comes from one of the raid's game
	// ids: the icon from its enemy, the thumbnail from its summon, the lobby
	// and background from its quest.
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import EntityImagesTab, {
		type ImageItem
	} from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import { getRaidCdnImage } from '$lib/utils/images/raids'
	import type { RecordTabProps } from '$lib/features/database/schema/types'
	import type { RaidFull } from '$lib/types/api/raid'

	type RaidImageSize = 'icon' | 'thumbnail' | 'lobby' | 'background'

	let { record: raid, canEdit }: RecordTabProps<RaidFull> = $props()

	// Every size shows, so editors can right-click one to save it
	const images = $derived<ImageItem[]>([
		{ url: getRaidCdnImage('icon', raid.enemyId), label: 'Icon', variant: 'icon' },
		{ url: getRaidCdnImage('thumbnail', raid.summonId), label: 'Thumbnail', variant: 'thumbnail' },
		{ url: getRaidCdnImage('lobby', raid.questId), label: 'Lobby', variant: 'lobby' },
		{
			url: getRaidCdnImage('background', raid.questId),
			label: 'Background',
			variant: 'background'
		}
	])

	async function downloadImage(size: string, _transformation: string | undefined, force: boolean) {
		await raidAdapter.downloadRaidImage(raid.slug, size as RaidImageSize, force)
	}

	async function downloadAll(force: boolean) {
		await raidAdapter.downloadRaidImages(raid.slug, { force })
	}
</script>

<EntityImagesTab
	{images}
	{canEdit}
	onDownloadImage={canEdit ? downloadImage : undefined}
	onDownloadAllImages={canEdit ? downloadAll : undefined}
/>
