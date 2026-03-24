
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Select from '../ui/Select.svelte'
	import Input from '../ui/Input.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import { pictureData } from '$lib/utils/pictureData'
	import { localizedName } from '$lib/utils/locale'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import type { ElementType } from '../ui/SettingsNav.svelte'

	interface Props {
		picture: string
		element: ElementType
		username: string
		displayName: string
		granblueId: string
		wikiProfile: string
		youtube: string
		gender: number
		onPictureChange: (value: string) => void
		onDisplayNameChange: (value: string) => void
		onGranblueIdChange: (value: string) => void
		onWikiProfileChange: (value: string) => void
		onYoutubeChange: (value: string) => void
		onGenderChange: (value: number) => void
	}

	let {
		picture,
		element,
		username,
		displayName,
		granblueId,
		wikiProfile,
		youtube,
		gender,
		onPictureChange,
		onDisplayNameChange,
		onGranblueIdChange,
		onWikiProfileChange,
		onYoutubeChange,
		onGenderChange
	}: Props = $props()

	// Prepare options for selects
	const pictureOptions = $derived(
		pictureData
			.sort((a, b) => localizedName(a.name).localeCompare(localizedName(b.name)))
			.map((p) => ({
				value: p.filename,
				label: localizedName(p.name),
				image: getAvatarSrc(p.filename)
			}))
	)

	const genderOptions = [
		{ value: 0, label: 'Gran' },
		{ value: 1, label: 'Djeeta' }
	]

	// Get current picture data
	const currentPicture = $derived(pictureData.find((p) => p.filename === picture))

	// Local state derived from props — overrides via bind:value are temporary
	let localPicture = $derived(picture)
	let localDisplayName = $derived(displayName)
	let localGranblueId = $derived(granblueId)
	let localWikiProfile = $derived(wikiProfile)
	let localYoutube = $derived(youtube)
	let localGender = $derived(gender)

	// Propagate changes
	$effect(() => {
		if (localPicture !== picture) onPictureChange(localPicture)
	})
	$effect(() => {
		if (localDisplayName !== displayName) onDisplayNameChange(localDisplayName)
	})
	$effect(() => {
		if (localGranblueId !== granblueId) onGranblueIdChange(localGranblueId)
	})
	$effect(() => {
		if (localWikiProfile !== wikiProfile) onWikiProfileChange(localWikiProfile)
	})
	$effect(() => {
		if (localYoutube !== youtube) onYoutubeChange(localYoutube)
	})
	$effect(() => {
		if (localGender !== gender) onGenderChange(localGender)
	})
</script>

<div class="section">
	<div class="form-fields">
		<!-- Avatar + Display Name (untitled section) -->
		<div class="picture-section">
			<div class="current-avatar">
				<img
					src={getAvatarSrc(localPicture)}
					srcset={getAvatarSrcSet(localPicture)}
					alt={currentPicture ? localizedName(currentPicture.name) : ''}
					class="avatar-preview element-{element}"
				/>
			</div>
			<Select
				bind:value={localPicture}
				options={pictureOptions}
				label={m.settings_avatar()}
				placeholder={m.settings_avatar_placeholder()}
				fullWidth
				contained
				portal
			/>
		</div>

		<SettingsRow title={m.settings_display_name()} subtitle={m.settings_display_name_subtitle()}>
			{#snippet control()}
				<Input bind:value={localDisplayName} placeholder={displayName ? m.settings_display_name_placeholder() : username} contained />
			{/snippet}
		</SettingsRow>

		<!-- Teams -->
		<h3 class="section-header">{m.settings_section_teams()}</h3>

		<SettingsRow title={m.settings_gender()} subtitle={m.settings_gender_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localGender}
					options={genderOptions}
					placeholder={m.settings_gender_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<!-- Elsewhere -->
		<h3 class="section-header">{m.settings_section_elsewhere()}</h3>

		<SettingsRow title={m.settings_granblue_id()} subtitle={m.settings_granblue_id_subtitle()}>
			{#snippet control()}
				<Input bind:value={localGranblueId} placeholder={m.settings_granblue_id_placeholder()} contained />
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_wiki_profile()} subtitle={m.settings_wiki_profile_subtitle()}>
			{#snippet control()}
				<Input bind:value={localWikiProfile} placeholder={m.settings_wiki_profile_placeholder()} contained />
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_youtube()} subtitle={m.settings_youtube_subtitle()}>
			{#snippet control()}
				<Input bind:value={localYoutube} placeholder={m.settings_youtube_placeholder()} contained />
			{/snippet}
		</SettingsRow>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.section {
		display: flex;
		flex-direction: column;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.section-header {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0;
	}

	.picture-section {
		display: flex;
		gap: spacing.$unit-3x;
		align-items: center;

		.current-avatar {
			flex-shrink: 0;
			width: 80px;
			height: 80px;

			.avatar-preview {
				width: 100%;
				height: 100%;
				object-fit: contain;
				border-radius: layout.$full-corner;
				padding: spacing.$unit;
				background-color: var(--placeholder-bg);

				&.element-fire {
					background-color: var(--fire-nav-selected-bg);
				}
				&.element-water {
					background-color: var(--water-nav-selected-bg);
				}
				&.element-earth {
					background-color: var(--earth-nav-selected-bg);
				}
				&.element-wind {
					background-color: var(--wind-nav-selected-bg);
				}
				&.element-light {
					background-color: var(--light-nav-selected-bg);
				}
				&.element-dark {
					background-color: var(--dark-nav-selected-bg);
				}
			}
		}
	}
</style>
