
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Select from '../ui/Select.svelte'
	import Input from '../ui/Input.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import { pictureData } from '$lib/utils/pictureData'
	import { localizedName } from '$lib/utils/locale'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { ELEMENT_HEX_COLORS } from '$lib/utils/gw'
	import type { ElementType } from '../ui/SettingsNav.svelte'

	interface Props {
		picture: string
		element: ElementType
		granblueId: string
		gender: number
		language: string
		theme: string
		onPictureChange: (value: string) => void
		onElementChange: (value: string) => void
		onGranblueIdChange: (value: string) => void
		onGenderChange: (value: number) => void
		onLanguageChange: (value: string) => void
		onThemeChange: (value: string) => void
	}

	let {
		picture,
		element,
		granblueId,
		gender,
		language,
		theme,
		onPictureChange,
		onElementChange,
		onGranblueIdChange,
		onGenderChange,
		onLanguageChange,
		onThemeChange
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

	// Create SVG circle data URL for element color
	function getElementCircle(el: string): string {
		const color = ELEMENT_HEX_COLORS[el] || '#888'
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="${color}"/></svg>`
		return `data:image/svg+xml,${encodeURIComponent(svg)}`
	}

	const elementOptions = [
		{ value: 'wind', label: m.settings_element_wind(), image: getElementCircle('wind') },
		{ value: 'fire', label: m.settings_element_fire(), image: getElementCircle('fire') },
		{ value: 'water', label: m.settings_element_water(), image: getElementCircle('water') },
		{ value: 'earth', label: m.settings_element_earth(), image: getElementCircle('earth') },
		{ value: 'dark', label: m.settings_element_dark(), image: getElementCircle('dark') },
		{ value: 'light', label: m.settings_element_light(), image: getElementCircle('light') }
	]

	const genderOptions = [
		{ value: 0, label: 'Gran' },
		{ value: 1, label: 'Djeeta' }
	]

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'ja', label: '日本語' }
	]

	const themeOptions = [
		{ value: 'system', label: m.settings_theme_system() },
		{ value: 'light', label: m.settings_theme_light() },
		{ value: 'dark', label: m.settings_theme_dark() }
	]

	// Get current picture data
	const currentPicture = $derived(pictureData.find((p) => p.filename === picture))

	// Local state for bound values
	let localPicture = $state(picture)
	let localElement = $state(element)
	let localGranblueId = $state(granblueId)
	let localGender = $state(gender)
	let localLanguage = $state(language)
	let localTheme = $state(theme)

	// Sync local state with props
	$effect(() => {
		localPicture = picture
	})
	$effect(() => {
		localElement = element
	})
	$effect(() => {
		localGranblueId = granblueId
	})
	$effect(() => {
		localGender = gender
	})
	$effect(() => {
		localLanguage = language
	})
	$effect(() => {
		localTheme = theme
	})

	// Propagate changes
	$effect(() => {
		if (localPicture !== picture) onPictureChange(localPicture)
	})
	$effect(() => {
		if (localElement !== element) onElementChange(localElement)
	})
	$effect(() => {
		if (localGranblueId !== granblueId) onGranblueIdChange(localGranblueId)
	})
	$effect(() => {
		if (localGender !== gender) onGenderChange(localGender)
	})
	$effect(() => {
		if (localLanguage !== language) onLanguageChange(localLanguage)
	})
	$effect(() => {
		if (localTheme !== theme) onThemeChange(localTheme)
	})
</script>

<div class="section">
	<div class="form-fields">
		<!-- Picture Selection with Preview -->
		<div class="picture-section">
			<div class="current-avatar">
				<img
					src={getAvatarSrc(localPicture)}
					srcset={getAvatarSrcSet(localPicture)}
					alt={currentPicture ? localizedName(currentPicture.name) : ''}
					class="avatar-preview element-{localElement}"
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

		<!-- Element Selection -->
		<SettingsRow title={m.settings_element()} subtitle={m.settings_element_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localElement}
					options={elementOptions}
					placeholder={m.settings_element_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<hr class="separator" />

		<!-- Granblue ID -->
		<SettingsRow title={m.settings_granblue_id()} subtitle={m.settings_granblue_id_subtitle()}>
			{#snippet control()}
				<Input bind:value={localGranblueId} placeholder={m.settings_granblue_id_placeholder()} contained />
			{/snippet}
		</SettingsRow>

		<hr class="separator" />

		<!-- Gender Selection -->
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

		<!-- Language Selection -->
		<SettingsRow title={m.settings_language()} subtitle={m.settings_language_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localLanguage}
					options={languageOptions}
					placeholder={m.settings_language_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<!-- Theme Selection -->
		<SettingsRow title={m.settings_theme()} subtitle={m.settings_theme_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localTheme}
					options={themeOptions}
					placeholder={m.settings_theme_placeholder()}
					contained
					portal
				/>
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

	.separator {
		border: none;
		border-top: 1px solid var(--separator-bg);
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
