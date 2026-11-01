<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Dialog from './ui/Dialog.svelte'
	import ModalHeader from './ui/ModalHeader.svelte'
	import ModalBody from './ui/ModalBody.svelte'
	import ModalFooter from './ui/ModalFooter.svelte'
	import SegmentedControl from './ui/segmented-control/SegmentedControl.svelte'
	import Segment from './ui/segmented-control/Segment.svelte'
	import type { ElementType } from './ui/SettingsNav.svelte'
	import AccountSettings from './settings/AccountSettings.svelte'
	import ProfileSettings from './settings/ProfileSettings.svelte'
	import AppearanceSettings from './settings/AppearanceSettings.svelte'
	import PrivacySettings from './settings/PrivacySettings.svelte'
	import ConfirmDialog from './ui/ConfirmDialog.svelte'
	import { UserSettingsState } from './settings/userSettingsState.svelte'
	import type { UserCookie } from '$lib/types/UserCookie'
	import type { SettingsReturn } from '$lib/auth/socialResult'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		username: string
		userId: string
		user: UserCookie
		role: number
		/** Section to jump to when the modal opens (otherwise the last one shown). */
		initialSection?: string | undefined
		/** Result of linking a provider, shown in the Account section. */
		socialResult?: SettingsReturn | null
	}

	let {
		open = $bindable(false),
		onOpenChange,
		username,
		userId,
		user,
		role,
		initialSection,
		socialResult = null
	}: Props = $props()

	const form = new UserSettingsState({
		open: () => open,
		username: () => username,
		userId: () => userId,
		user: () => user,
		close: handleClose
	})

	// Active section for navigation
	let activeSection = $state<string>('profile')

	let contentElement: HTMLElement | undefined = $state()
	let isScrolledToBottom = $state(true)
	let isScrolledFromTop = $state(false)

	// Jump to the requested section when the modal is opened with one
	$effect(() => {
		if (open && initialSection) activeSection = initialSection
	})

	// Handle section change from segmented control
	function handleSectionChange(value: string) {
		activeSection = value
	}

	// Check if scrolled to bottom
	function checkScrollPosition() {
		if (!contentElement) return
		const { scrollTop, scrollHeight, clientHeight } = contentElement
		// Consider "at bottom" if within 5px of the bottom
		isScrolledFromTop = scrollTop > 5
		isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5
	}

	// Check scroll position when content element is bound or section changes
	$effect(() => {
		if (contentElement) {
			// Small delay to let content render
			setTimeout(checkScrollPosition, 0)
		}
	})

	// Re-check when section changes
	$effect(() => {
		void activeSection // Track this dependency
		if (contentElement) {
			setTimeout(checkScrollPosition, 0)
		}
	})

	function handleClose() {
		open = false
		onOpenChange?.(false)
	}
</script>

<Dialog bind:open {...onOpenChange ? { onOpenChange } : {}} size="medium" hideClose>
	<ModalHeader title={m.settings_title()}>
		<span class="header-username">@{username}</span>
	</ModalHeader>
	<ModalBody noPadding>
		<div class="settings-layout">
			<div class="settings-nav" class:scrolled={isScrolledFromTop}>
				<SegmentedControl
					value={activeSection}
					onValueChange={handleSectionChange}
					variant="background"
					size="small"
					element={form.element}
					grow
				>
					<Segment value="profile">{m.settings_nav_profile()}</Segment>
					<Segment value="appearance">{m.settings_nav_appearance()}</Segment>
					<Segment value="account">{m.settings_nav_account()}</Segment>
					<Segment value="privacy">{m.settings_nav_privacy()}</Segment>
				</SegmentedControl>
			</div>

			<div class="settings-content" bind:this={contentElement} onscroll={checkScrollPosition}>
				{#if form.error}
					<div class="error-message">{form.error}</div>
				{/if}
				{#if form.isLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<span>{m.settings_loading()}</span>
					</div>
				{:else if activeSection === 'profile'}
					<ProfileSettings
						picture={form.picture}
						element={form.element}
						{username}
						displayName={form.displayName}
						description={form.description}
						granblueId={form.granblueId}
						wikiProfile={form.wikiProfile}
						youtube={form.youtube}
						gender={form.gender}
						onPictureChange={(v) => (form.picture = v)}
						onDisplayNameChange={(v) => (form.displayName = v)}
						onDescriptionChange={(v) => (form.description = v)}
						onGranblueIdChange={(v) => (form.granblueId = v)}
						onWikiProfileChange={(v) => (form.wikiProfile = v)}
						onYoutubeChange={(v) => (form.youtube = v)}
						onGenderChange={(v) => (form.gender = v)}
					/>
				{:else if activeSection === 'appearance'}
					<AppearanceSettings
						element={form.element}
						theme={form.theme}
						language={form.language}
						timezone={form.timezone}
						defaultRepView={form.defaultRepView}
						simplePortraits={form.simplePortraits}
						onElementChange={(v) => (form.element = v as ElementType)}
						onThemeChange={(v) => (form.theme = v)}
						onLanguageChange={(v) => (form.language = v)}
						onTimezoneChange={(v) => (form.timezone = v)}
						onDefaultRepViewChange={(v) => (form.defaultRepView = v)}
						onSimplePortraitsChange={(v) => (form.simplePortraits = v)}
					/>
				{:else if activeSection === 'account'}
					<AccountSettings
						username={form.formUsername}
						email={form.email}
						emailVerified={form.emailVerified}
						bahamut={form.bahamut}
						{role}
						element={form.element}
						currentPassword={form.currentPassword}
						newPassword={form.newPassword}
						confirmPassword={form.confirmPassword}
						onUsernameChange={(v) => (form.formUsername = v)}
						onEmailChange={(v) => (form.email = v)}
						onBahamutChange={(v) => (form.bahamut = v)}
						onUsernameValidChange={(v) => (form.usernameValid = v)}
						onCurrentPasswordChange={(v) => (form.currentPassword = v)}
						onNewPasswordChange={(v) => (form.newPassword = v)}
						onConfirmPasswordChange={(v) => (form.confirmPassword = v)}
						hasPassword={form.hasPassword}
						passwordPromptDismissed={form.passwordPromptDismissed}
						onPasswordPromptDismissed={form.dismissPasswordPrompt}
						{socialResult}
					/>
				{:else if activeSection === 'privacy'}
					<PrivacySettings
						collectionPrivacy={form.collectionPrivacy}
						showCrewGamertag={form.showCrewGamertag}
						importWeapons={form.importWeapons}
						defaultImportVisibility={form.defaultImportVisibility}
						isInCrew={form.isInCrew}
						crewGamertag={form.crewGamertag}
						element={form.element}
						onCollectionPrivacyChange={(v) => {
							if (v !== undefined) form.collectionPrivacy = v
						}}
						onShowCrewGamertagChange={(v) => (form.showCrewGamertag = v)}
						onImportWeaponsChange={(v) => (form.importWeapons = v)}
						onDefaultImportVisibilityChange={(v) => {
							if (v !== undefined) form.defaultImportVisibility = v
						}}
					/>
				{/if}
			</div>
		</div>
	</ModalBody>

	<ModalFooter
		onCancel={handleClose}
		cancelDisabled={form.saving}
		primaryAction={{
			label: form.saving ? m.settings_saving() : m.settings_save(),
			onclick: form.requestSave,
			disabled: form.saving || form.isLoading || !form.usernameValid
		}}
		showShadow={!isScrolledToBottom}
	/>
	<ConfirmDialog
		bind:open={form.usernameConfirmOpen}
		title={m.settings_username_confirm_title()}
		message={m.settings_username_confirm_message()}
		confirmLabel={m.settings_username_confirm_action()}
		onconfirm={form.save}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.header-username {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.settings-layout {
		display: flex;
		flex-direction: column;
		height: 500px;
	}

	.settings-nav {
		padding: spacing.$unit-2x spacing.$unit-3x;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		&.scrolled {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

			:global([data-theme='dark']) & {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.error-message {
		background-color: var(--danger-bg-subtle);
		border: 1px solid var(--danger);
		border-radius: layout.$card-corner;
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
	}

	.settings-content {
		flex: 1;
		overflow-y: auto;
		padding: 0 spacing.$unit-3x;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-color);
		border-top-color: var(--text-secondary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
