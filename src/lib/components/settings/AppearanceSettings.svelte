<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Select from '../ui/Select.svelte'
	import Switch from '../ui/switch/Switch.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import ElementPicker from '../ui/element-picker/ElementPicker.svelte'
	import type { ElementType } from '../ui/SettingsNav.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { getTimezoneOptions, normalizeTimezone } from '$lib/utils/timezone'

	interface Props {
		element: ElementType
		theme: string
		language: string
		timezone: string
		defaultRepView: string
		simplePortraits: boolean
		onElementChange: (value: string) => void
		onThemeChange: (value: string) => void
		onLanguageChange: (value: string) => void
		onTimezoneChange: (value: string) => void
		onDefaultRepViewChange: (value: string) => void
		onSimplePortraitsChange: (value: boolean) => void
	}

	let {
		element,
		theme,
		language,
		timezone,
		defaultRepView,
		simplePortraits,
		onElementChange,
		onThemeChange,
		onLanguageChange,
		onTimezoneChange,
		onDefaultRepViewChange,
		onSimplePortraitsChange
	}: Props = $props()

	// Element key ↔ numeric ID conversion
	const ELEMENT_KEY_TO_ID: Record<string, number> = {
		wind: 1,
		fire: 2,
		water: 3,
		earth: 4,
		dark: 5,
		light: 6
	}
	const elementId = $derived(ELEMENT_KEY_TO_ID[element] ?? 1)

	// Language/Theme local state (writable derived syncs from props)
	let localLanguage = $derived(language)
	let localTheme = $derived(theme)

	function handleLanguageSelect(value: string | undefined) {
		if (value === undefined) return
		localLanguage = value
		onLanguageChange(value)
	}

	function handleThemeSelect(value: string | undefined) {
		if (value === undefined) return
		localTheme = value
		onThemeChange(value)
	}

	function handleTimezoneSelect(value: string | undefined) {
		if (value === undefined) return
		onTimezoneChange(value)
	}

	function handleRepViewSelect(value: string | undefined) {
		if (value === undefined) return
		onDefaultRepViewChange(value)
	}

	const timezoneOptions = getTimezoneOptions()

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'ja', label: '日本語' }
	]

	const themeOptions = [
		{ value: 'system', label: m.settings_theme_system() },
		{ value: 'light', label: m.settings_theme_light() },
		{ value: 'dark', label: m.settings_theme_dark() }
	]

	const repViewOptions = [
		{ value: 'characters', label: m.nav_characters() },
		{ value: 'weapons', label: m.nav_weapons() },
		{ value: 'summons', label: m.nav_summons() }
	]
</script>

<div class="section">
	<div class="form-fields">
		<!-- Appearance -->
		<h3 class="section-header">{m.settings_section_appearance()}</h3>

		<SettingsRow title={m.settings_element()} subtitle={m.settings_element_subtitle()}>
			{#snippet control()}
				<ElementPicker
					value={elementId}
					onValueChange={(v) => {
						const key = getElementKey(v as number)
						onElementChange(key)
					}}
					mode="dropdown"
					contained
				/>
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_theme()} subtitle={m.settings_theme_subtitle()}>
			{#snippet control()}
				<Select
					value={localTheme}
					onValueChange={handleThemeSelect}
					options={themeOptions}
					placeholder={m.settings_theme_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_language()} subtitle={m.settings_language_subtitle()}>
			{#snippet control()}
				<Select
					value={localLanguage}
					onValueChange={handleLanguageSelect}
					options={languageOptions}
					placeholder={m.settings_language_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_timezone()} subtitle={m.settings_timezone_subtitle()}>
			{#snippet control()}
				<Select
					value={normalizeTimezone(timezone)}
					onValueChange={handleTimezoneSelect}
					options={timezoneOptions}
					placeholder={m.settings_timezone_placeholder()}
					contained
					portal
					contentWidthOffset={140}
				/>
			{/snippet}
		</SettingsRow>

		<!-- Display -->
		<h3 class="section-header">{m.settings_section_display()}</h3>

		<SettingsRow
			title={m.settings_default_rep_view()}
			subtitle={m.settings_default_rep_view_subtitle()}
		>
			{#snippet control()}
				<Select
					value={defaultRepView}
					onValueChange={handleRepViewSelect}
					options={repViewOptions}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<SettingsRow title={m.settings_umikin_mode()} subtitle={m.settings_umikin_subtitle()}>
			{#snippet control()}
				<Switch
					checked={simplePortraits}
					name="umikin-mode"
					{element}
					onCheckedChange={onSimplePortraitsChange}
				/>
			{/snippet}
		</SettingsRow>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

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
		margin: spacing.$unit-2x 0 0;

		&:first-child {
			margin-top: 0;
		}
	}
</style>
