
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { getElementOptions } from '$lib/utils/element'
	import { getRaceLabel, getRaceOptions } from '$lib/utils/race'
	import { getGenderLabel, getGenderOptions } from '$lib/utils/gender'
	import { getProficiencyOptions } from '$lib/utils/proficiency'
	import { getElementLabel } from '$lib/utils/element'
	import { getCharacterImage } from '$lib/utils/images'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		character: any
		editMode?: boolean
		editData?: any
	}

	let {
		character,
		editMode = false,
		editData = $bindable()
	}: Props = $props()

	const elementOptions = getElementOptions()
	const raceOptions = getRaceOptions()
	const genderOptions = getGenderOptions()
	const proficiencyOptions = getProficiencyOptions()

	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData.element : character?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<DetailItem
			label="Element"
			bind:value={editData.element}
			editable={true}
			type="select"
			options={elementOptions}
		/>
		<DetailItem
			label="Race 1"
			bind:value={editData.race1}
			editable={true}
			type="select"
			options={raceOptions}
		/>
		<DetailItem
			label="Race 2"
			bind:value={editData.race2}
			editable={true}
			type="select"
			options={raceOptions}
		/>
		<DetailItem
			label="Gender"
			bind:value={editData.gender}
			editable={true}
			type="select"
			options={genderOptions}
		/>
		<DetailItem
			label="Proficiency 1"
			bind:value={editData.proficiency1}
			editable={true}
			type="select"
			options={proficiencyOptions}
		/>
		<DetailItem
			label="Proficiency 2"
			bind:value={editData.proficiency2}
			editable={true}
			type="select"
			options={proficiencyOptions}
		/>
		<DetailItem
			label="Style Swap"
			bind:value={editData.styleSwap}
			editable={true}
			type="checkbox"
			element={elementName}
		/>
		{#if editData.styleSwap}
			<DetailItem
				label="Style Name (EN)"
				bind:value={editData.styleNameEn}
				editable={true}
				type="text"
				placeholder="e.g. Legend of Bravado and Revelry"
				width="480px"
			/>
			<DetailItem
				label="Style Name (JP)"
				bind:value={editData.styleNameJp}
				editable={true}
				type="text"
				placeholder="例：武勇と歓喜の伝説"
				width="480px"
			/>
		{/if}
	{:else}
		<DetailItem label="Element">
			<ElementLabel element={character.element} size="medium" />
		</DetailItem>
		<DetailItem label="Race 1" value={getRaceLabel(character.race?.[0])} />
		<DetailItem label="Race 2" value={getRaceLabel(character.race?.[1])} />
		<DetailItem label="Gender" value={getGenderLabel(character.gender)} />
		<DetailItem label="Proficiency 1">
			<ProficiencyLabel proficiency={character.proficiency?.[0] ?? 0} size="medium" />
		</DetailItem>
		<DetailItem label="Proficiency 2">
			<ProficiencyLabel proficiency={character.proficiency?.[1] ?? 0} size="medium" />
		</DetailItem>
		{#if character.styleSwap}
			<DetailItem label="Style Swap" value="Yes" />
			{#if character.styleName?.en}
				<DetailItem label="Style Name (EN)" value={character.styleName.en} />
			{/if}
			{#if character.styleName?.ja}
				<DetailItem label="Style Name (JP)" value={character.styleName.ja} />
			{/if}
			{#if character.baseCharacter}
				<DetailItem label="Base Character">
					<a href="/database/characters/{character.baseCharacter.granblueId}" class="base-character-link">
						<img
							src={getCharacterImage(character.baseCharacter.granblueId, 'square', '01')}
							alt={character.baseCharacter.name?.en || 'Base character'}
							class="base-character-image"
						/>
						<span class="base-character-name">{character.baseCharacter.name?.en}</span>
					</a>
				</DetailItem>
			{/if}
		{/if}
	{/if}
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.base-character-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		text-decoration: none;
		color: var(--text-primary);
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}

	.base-character-image {
		width: 32px;
		height: 32px;
		border-radius: layout.$item-corner-small;
	}

	.base-character-name {
		font-size: typography.$font-regular;
	}
</style>
