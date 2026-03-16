<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { localizedName } from '$lib/utils/locale'
	import { getJobIconUrl } from '$lib/utils/jobUtils'
	import { getCharacterImage, getWeaponImage } from '$lib/utils/images'

	type EntityType = 'job' | 'character' | 'weapon'

	interface Props {
		type: EntityType
		entity: { granblueId: string; name: { en: string; ja: string } }
	}

	let { type, entity }: Props = $props()

	const href = $derived(localizeHref(`/database/${type}s/${entity.granblueId}`))

	function getImageUrl(): string {
		switch (type) {
			case 'job':
				return getJobIconUrl(entity.granblueId)
			case 'character':
				return getCharacterImage(entity.granblueId, 'square', '01')
			case 'weapon':
				return getWeaponImage(entity.granblueId, 'square')
		}
	}
</script>

<a {href} class="entity-link">
	<img src={getImageUrl()} alt="" class="entity-image" class:square={type !== 'job'} />
	{localizedName(entity.name)}
</a>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;

	.entity-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		color: var(--text-primary);
		text-decoration: none;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}

	.entity-image {
		width: auto;
		height: 24px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;

		&.square {
			width: 32px;
			height: 32px;
			border-radius: layout.$item-corner;
		}
	}
</style>
