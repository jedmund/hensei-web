
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getAwakeningImage } from '$lib/utils/modifiers'
	import type { Awakening } from '$lib/types/api/entities'

	/**
	 * All weapon awakening types from the game database.
	 * These are static and don't change.
	 */
	const ALL_WEAPON_AWAKENINGS: Awakening[] = [
		{ id: 'd691a61c-dc7e-4d92-a8e6-98c04608353c', name: { en: 'Attack', ja: '攻撃' }, slug: 'weapon-atk', order: 1 },
		{ id: '969d37db-5f14-4d1a-bef4-59ba5a016674', name: { en: 'Defense', ja: '防御' }, slug: 'weapon-def', order: 2 },
		{ id: '275c9de5-db1e-4c66-8210-660505fd1af4', name: { en: 'Special', ja: '特殊' }, slug: 'weapon-special', order: 3 },
		{ id: 'a60b8356-ec37-4f8b-a188-a3d48803ac76', name: { en: 'C.A.', ja: '奥義' }, slug: 'weapon-ca', order: 4 },
		{ id: '26a47007-8886-476a-b6c0-b56c8fcdb09f', name: { en: 'Healing', ja: '回復' }, slug: 'weapon-heal', order: 5 },
		{ id: '18ab5007-3fcb-4f83-a7a0-879a9a4a7ad7', name: { en: 'Skill DMG', ja: 'アビダメ' }, slug: 'weapon-skill', order: 6 }
	]

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let {
		weapon,
		editMode = false,
		editData = $bindable()
	}: Props = $props()

	const awakenings = $derived.by((): Awakening[] => {
		if (editMode) {
			const ids: string[] = editData?.awakeningIds ?? []
			return ALL_WEAPON_AWAKENINGS
				.filter((a) => ids.includes(a.id))
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		}
		const list = weapon?.awakenings ?? []
		return [...list].sort((a: Awakening, b: Awakening) => (a.order ?? 0) - (b.order ?? 0))
	})

	const hasAwakenings = $derived(awakenings.length > 0)

	// Awakenings not yet added (for the dropdown)
	const availableOptions = $derived(
		ALL_WEAPON_AWAKENINGS
			.filter((a) => !(editData?.awakeningIds ?? []).includes(a.id))
			.map((a) => ({ value: a.id, label: a.name?.en ?? a.slug }))
	)

	function handleAdd(id: string | undefined) {
		if (!id || !editData) return
		editData.awakeningIds = [...(editData.awakeningIds ?? []), id]
	}

	function removeAwakening(id: string) {
		if (!editData) return
		editData.awakeningIds = (editData.awakeningIds ?? []).filter((aid: string) => aid !== id)
	}
</script>

{#if editMode}
	<DetailsContainer title="Awakenings">
		{#if availableOptions.length > 0}
			<Select
				options={availableOptions}
				placeholder="Add awakening..."
				onValueChange={handleAdd}
				contained
				fullWidth
			/>
		{/if}
		{#if awakenings.length > 0}
			<div class="awakening-list">
				{#each awakenings as awakening (awakening.id)}
					{@const imageUrl = getAwakeningImage({ type: awakening })}
					<div class="awakening-item">
						{#if imageUrl}
							<img src={imageUrl} alt={awakening.name?.en ?? awakening.slug} class="awakening-icon" />
						{:else}
							<div class="awakening-icon placeholder"></div>
						{/if}
						<span class="awakening-name">{awakening.name?.en ?? awakening.slug}</span>
						<button class="remove-button" onclick={() => removeAwakening(awakening.id)}>
							<Icon name="close" size={14} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</DetailsContainer>
{:else if hasAwakenings}
	<DetailsContainer title="Awakenings">
		<div class="awakening-list">
			{#each awakenings as awakening (awakening.id)}
				{@const imageUrl = getAwakeningImage({ type: awakening })}
				<div class="awakening-item">
					{#if imageUrl}
						<img src={imageUrl} alt={awakening.name?.en ?? awakening.slug} class="awakening-icon" />
					{:else}
						<div class="awakening-icon placeholder"></div>
					{/if}
					<span class="awakening-name">{awakening.name?.en ?? awakening.slug}</span>
				</div>
			{/each}
		</div>
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.awakening-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.awakening-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--background);
		border-radius: layout.$item-corner-small;
	}

	.awakening-icon {
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;

		&.placeholder {
			background: var(--separator-bg);
		}
	}

	.awakening-name {
		font-size: typography.$font-regular;
		color: var(--text-primary);
		font-weight: typography.$medium;
	}

	.remove-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		margin-left: auto;

		&:hover {
			color: var(--text-primary);
			background: var(--separator-bg);
		}
	}
</style>
