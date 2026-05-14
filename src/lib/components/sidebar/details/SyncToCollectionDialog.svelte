<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import type {
		CollectionCharacter,
		CollectionWeapon,
		CollectionSummon
	} from '$lib/types/api/collection'
	import Dialog from '../../ui/Dialog.svelte'
	import ModalHeader from '../../ui/ModalHeader.svelte'
	import ModalBody from '../../ui/ModalBody.svelte'
	import ModalFooter from '../../ui/ModalFooter.svelte'
	import SyncFieldDiff from './SyncFieldDiff.svelte'
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'

	type GridItem = GridCharacter | GridWeapon | GridSummon
	type CollectionItem = CollectionCharacter | CollectionWeapon | CollectionSummon

	interface Props {
		open: boolean
		type: 'character' | 'weapon' | 'summon'
		/** Localized phrase describing what's being saved (e.g. "Weapon Key 2",
		 * "Uncap & Transcendence"). Falls back to the "settings" scope when omitted. */
		scope?: string | undefined
		/** Localized character/weapon/summon name used in the body copy. */
		name?: string | undefined
		/** Camel-cased dotted-key list of fields that will be pushed. */
		fields?: string[] | undefined
		/** Grid item providing the "after" (new) values. */
		gridItem?: GridItem | undefined
		/** Collection item providing the "before" (current) values. */
		collectionItem?: CollectionItem | undefined
		onConfirm: () => Promise<void>
	}

	let {
		open = $bindable(false),
		type,
		scope,
		name,
		fields,
		gridItem,
		collectionItem,
		onConfirm
	}: Props = $props()

	const scopeLabel = $derived(scope ?? m.sync_to_collection_scope_all())
	const nameLabel = $derived(
		name ??
			(type === 'character'
				? m.type_character()
				: type === 'weapon'
					? m.type_weapon()
					: m.type_summon())
	)

	const diffFields = $derived(fields && fields.length > 0 ? fields : [])
	const canShowDiff = $derived(diffFields.length > 0 && !!gridItem && !!collectionItem)

	// Small thumbnail for the diff-list header.
	const headerImage = $derived.by(() => {
		if (!gridItem) return null
		if (type === 'character') {
			const c = (gridItem as GridCharacter).character
			return c ? getCharacterImage(c.granblueId, 'square', c.styleSwap ? '01_style' : '01') : null
		}
		if (type === 'weapon') {
			const w = (gridItem as GridWeapon).weapon
			return w ? getWeaponImage(w.granblueId, 'square', w.element === 0 ? 0 : undefined) : null
		}
		const s = (gridItem as GridSummon).summon
		return s ? getSummonImage(s.granblueId, 'square') : null
	})
</script>

<Dialog bind:open>
	<ModalHeader title={m.sync_to_collection_title()} />
	<ModalBody>
		<p class="sync-message">
			{m.sync_to_collection_body({ name: nameLabel, section: scopeLabel })}
		</p>
		{#if canShowDiff && gridItem && collectionItem}
			<div class="diff-list">
				<div class="diff-header">
					<div class="diff-header-item">
						{#if headerImage}
							<img src={headerImage} alt={nameLabel} class="diff-header-image" />
						{/if}
						<span class="diff-header-name">{nameLabel}</span>
					</div>
					<div class="diff-header-columns">
						<span class="diff-column-label">{m.sync_diff_column_collection()}</span>
						<span class="diff-column-spacer" aria-hidden="true"></span>
						<span class="diff-column-label">{m.sync_diff_column_team()}</span>
					</div>
				</div>
				{#each diffFields as fieldKey (fieldKey)}
					<SyncFieldDiff {fieldKey} {type} {gridItem} {collectionItem} />
				{/each}
			</div>
		{/if}
	</ModalBody>
	<ModalFooter
		onCancel={() => {
			open = false
		}}
		primaryAction={{
			label: m.sync_to_collection_confirm(),
			onclick: async () => {
				await onConfirm()
				open = false
			}
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.sync-message {
		margin: 0 0 $unit-2x;
		font-size: $font-regular;
		line-height: 1.4;
		color: var(--text-primary);
	}

	.diff-list {
		display: flex;
		flex-direction: column;
		padding: $unit-2x;
		background: var(--button-contained-bg);
		border-radius: $card-corner;
	}

	.diff-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $unit-2x;
		padding-bottom: $unit;
	}

	.diff-header-item {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.diff-header-image {
		width: 32px;
		height: 32px;
		border-radius: $item-corner-small;
		object-fit: cover;
		flex-shrink: 0;
	}

	.diff-header-name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	// Mirror the .diff-values flex row so the column headers sit above the
	// matching value columns: [Collection] [arrow gap] [Team].
	.diff-header-columns {
		display: flex;
		align-items: center;
		gap: $unit;
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.diff-column-spacer {
		display: inline-block;
		width: 14px;
	}
</style>
