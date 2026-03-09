
<script lang="ts">
	import Select from '../ui/Select.svelte'
	import Switch from '../ui/switch/Switch.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import type { ElementType } from '../ui/SettingsNav.svelte'

	interface Props {
		showGranblueId: boolean
		collectionPrivacy: number
		showCrewGamertag: boolean
		isInCrew: boolean
		crewGamertag?: string
		element: ElementType
		onShowGranblueIdChange: (value: boolean) => void
		onCollectionPrivacyChange: (value: number) => void
		onShowCrewGamertagChange: (value: boolean) => void
	}

	let {
		showGranblueId,
		collectionPrivacy,
		showCrewGamertag,
		isInCrew,
		crewGamertag,
		element,
		onShowGranblueIdChange,
		onCollectionPrivacyChange,
		onShowCrewGamertagChange
	}: Props = $props()

	// Collection privacy options (1-based to avoid JavaScript falsy 0 issues)
	const collectionPrivacyOptions = [
		{ value: 1, label: 'Everyone', description: 'Anyone can view your collection' },
		{ value: 2, label: 'Crew only', description: 'Only crew members can view' },
		{ value: 3, label: 'Private', description: 'Only you can view your collection' }
	]

</script>

<div class="section">
	<div class="form-fields">
		<!-- Show Granblue ID on profile -->
		<SettingsRow
			title="Show Granblue ID on profile"
			subtitle="Display your in-game ID on your public profile"
		>
			{#snippet control()}
				<Switch
					checked={showGranblueId}
					name="show-granblue-id"
					{element}
					onCheckedChange={onShowGranblueIdChange}
				/>
			{/snippet}
		</SettingsRow>

		<!-- Show Crew Gamertag (only if in a crew with a gamertag) -->
		{#if isInCrew && crewGamertag}
			<SettingsRow
				title="Show crew tag on profile"
				subtitle={`Display "${crewGamertag}" next to your name`}
			>
				{#snippet control()}
					<Switch
						checked={showCrewGamertag}
						name="show-crew-gamertag"
						{element}
						onCheckedChange={onShowCrewGamertagChange}
					/>
				{/snippet}
			</SettingsRow>

			<hr class="separator" />
		{/if}

		<!-- Collection Privacy -->
		<SettingsRow
			title="Collection visibility"
			subtitle="Control who can view your character, weapon, and summon collection"
		>
			{#snippet control()}
				<Select
					value={collectionPrivacy}
					onValueChange={onCollectionPrivacyChange}
					options={collectionPrivacyOptions}
					placeholder="Who can see your collection"
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.section {
		display: flex;
		flex-direction: column;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.separator {
		border: none;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
		margin: 0;
	}
</style>
