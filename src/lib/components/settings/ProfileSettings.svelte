<svelte:options runes={true} />

<script lang="ts">
	import Select from '../ui/Select.svelte'
	import Input from '../ui/Input.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import { pictureData } from '$lib/utils/pictureData'
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

	// Get current locale from user settings
	const locale = $derived(language as 'en' | 'ja')

	// Prepare options for selects
	const pictureOptions = $derived(
		pictureData
			.sort((a, b) => a.name.en.localeCompare(b.name.en))
			.map((p) => ({
				value: p.filename,
				label: p.name[locale] || p.name.en,
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
		{ value: 'wind', label: 'Wind', image: getElementCircle('wind') },
		{ value: 'fire', label: 'Fire', image: getElementCircle('fire') },
		{ value: 'water', label: 'Water', image: getElementCircle('water') },
		{ value: 'earth', label: 'Earth', image: getElementCircle('earth') },
		{ value: 'dark', label: 'Dark', image: getElementCircle('dark') },
		{ value: 'light', label: 'Light', image: getElementCircle('light') }
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
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
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
					alt={currentPicture?.name[locale] || ''}
					class="avatar-preview element-{localElement}"
				/>
			</div>
			<Select
				bind:value={localPicture}
				options={pictureOptions}
				label="Avatar"
				placeholder="Select an avatar"
				fullWidth
				contained
			/>
		</div>

		<!-- Element Selection -->
		<SettingsRow title="Element" subtitle="Your profile accent color">
			{#snippet control()}
				<Select
					bind:value={localElement}
					options={elementOptions}
					placeholder="Select an element"
					contained
				/>
			{/snippet}
		</SettingsRow>

		<hr class="separator" />

		<!-- Granblue ID -->
		<SettingsRow title="Granblue ID" subtitle="Your in-game player ID">
			{#snippet control()}
				<Input bind:value={localGranblueId} placeholder="Enter ID" contained />
			{/snippet}
		</SettingsRow>

		<hr class="separator" />

		<!-- Gender Selection -->
		<SettingsRow title="Gender" subtitle="Your in-game character">
			{#snippet control()}
				<Select
					bind:value={localGender}
					options={genderOptions}
					placeholder="Select gender"
					contained
				/>
			{/snippet}
		</SettingsRow>

		<!-- Language Selection -->
		<SettingsRow title="Language" subtitle="Display language for the site">
			{#snippet control()}
				<Select
					bind:value={localLanguage}
					options={languageOptions}
					placeholder="Select language"
					contained
				/>
			{/snippet}
		</SettingsRow>

		<!-- Theme Selection -->
		<SettingsRow title="Theme" subtitle="Light, dark, or system default">
			{#snippet control()}
				<Select
					bind:value={localTheme}
					options={themeOptions}
					placeholder="Select theme"
					contained
				/>
			{/snippet}
		</SettingsRow>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;
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
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
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
					background-color: colors.$fire-bg-20;
				}
				&.element-water {
					background-color: colors.$water-bg-20;
				}
				&.element-earth {
					background-color: colors.$earth-bg-20;
				}
				&.element-wind {
					background-color: colors.$wind-bg-20;
				}
				&.element-light {
					background-color: colors.$light-bg-20;
				}
				&.element-dark {
					background-color: colors.$dark-bg-20;
				}
			}
		}
	}
</style>
