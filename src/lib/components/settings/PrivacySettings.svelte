
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
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
		{ value: 1, label: m.settings_privacy_everyone(), description: m.settings_privacy_everyone_desc() },
		{ value: 2, label: m.settings_privacy_crew(), description: m.settings_privacy_crew_desc() },
		{ value: 3, label: m.settings_privacy_private(), description: m.settings_privacy_private_desc() }
	]

</script>

<div class="section">
	<div class="form-fields">
		<!-- Show Granblue ID on profile -->
		<SettingsRow
			title={m.settings_show_granblue_id()}
			subtitle={m.settings_show_granblue_id_subtitle()}
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
				title={m.settings_show_crew_tag()}
				subtitle={m.settings_show_crew_tag_subtitle({ gamertag: crewGamertag ?? '' })}
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
			title={m.settings_collection_visibility()}
			subtitle={m.settings_collection_visibility_subtitle()}
		>
			{#snippet control()}
				<Select
					value={collectionPrivacy}
					onValueChange={onCollectionPrivacyChange}
					options={collectionPrivacyOptions}
					placeholder={m.settings_collection_visibility_placeholder()}
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
