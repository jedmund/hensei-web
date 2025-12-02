<svelte:options runes={true} />

<script lang="ts">
	import Dialog from './ui/Dialog.svelte'
	import Select from './ui/Select.svelte'
	import Switch from './ui/switch/Switch.svelte'
	import Button from './ui/Button.svelte'
	import { pictureData, type Picture } from '$lib/utils/pictureData'
	import { users } from '$lib/api/resources/users'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { setUserCookie } from '$lib/auth/cookies'
	import { invalidateAll } from '$app/navigation'
	
	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		username: string
		userId: string
		user: UserCookie
		role: number
	}

	let { open = $bindable(false), onOpenChange, username, userId, user, role }: Props = $props()

	// Form state
	let picture = $state(user.picture)
	let element = $state(user.element)
	let gender = $state(user.gender)
	let language = $state(user.language)
	let theme = $state(user.theme)
	let bahamut = $state(user.bahamut ?? false)

	let saving = $state(false)
	let error = $state<string | null>(null)

	// Get current locale from user settings
	const locale = $derived(user.language as 'en' | 'ja')

	// Prepare options for selects
	const pictureOptions = $derived(
		pictureData
			.sort((a, b) => a.name.en.localeCompare(b.name.en))
			.map((p) => ({
				value: p.filename,
				label: p.name[locale] || p.name.en,
				image: `/profile/${p.filename}.png`
			}))
	)

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

	// Element colors for circle indicators
	const elementColors: Record<string, string> = {
		wind: '#3ee489',
		fire: '#fa6d6d',
		water: '#6cc9ff',
		earth: '#fd9f5b',
		dark: '#de7bff',
		light: '#e8d633'
	}

	// Create SVG circle data URL for element color
	function getElementCircle(element: string): string {
		const color = elementColors[element] || '#888'
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

	// Get current picture data
	const currentPicture = $derived(pictureData.find((p) => p.filename === picture))

	// Handle form submission
	async function handleSave(e: Event) {
		e.preventDefault()
		error = null
		saving = true

		try {
			// Prepare the update data
			const updateData = {
				picture,
				element,
				gender,
				language,
				theme
			}

			// Call API to update user settings
			const response = await users.update(userId, updateData)

			// Update the user cookie
			const updatedUser: UserCookie = {
				picture: response.avatar.picture,
				element: response.avatar.element,
				language: response.language,
				gender: response.gender,
				theme: response.theme,
				bahamut
			}

			// Save to cookie (we'll need to handle this server-side)
			// For now, we'll just update the local state
			const expires = new Date()
			expires.setDate(expires.getDate() + 60)

			// Make a request to update the cookie server-side
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatedUser)
			})

			// If language or theme changed, we need a full page reload
			if (user.language !== language || user.theme !== theme || user.bahamut !== bahamut) {
				await invalidateAll()
				window.location.reload()
			} else {
				// For other changes (element, picture, gender), invalidate to refresh layout data
				await invalidateAll()
			}

			// Close the modal
			handleClose()
		} catch (err) {
			console.error('Failed to update settings:', err)
			error = 'Failed to update settings. Please try again.'
		} finally {
			saving = false
		}
	}

	function handleClose() {
		open = false
		onOpenChange?.(false)
	}
</script>

<Dialog
	bind:open
	{...onOpenChange ? { onOpenChange } : {}}
	title="@{username}"
	description="Account Settings"
>
	{#snippet children()}
		<form onsubmit={handleSave} class="settings-form">
			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="form-fields">
				<!-- Picture Selection with Preview -->
				<div class="picture-section">
					<div class="current-avatar">
						<img
							src={`/profile/${picture}.png`}
							srcset={`/profile/${picture}.png 1x, /profile/${picture}@2x.png 2x`}
							alt={currentPicture?.name[locale] || ''}
							class="avatar-preview element-{element}"
						/>
					</div>
					<Select
						bind:value={picture}
						options={pictureOptions}
						label="Avatar"
						placeholder="Select an avatar"
						fullWidth
						contained
					/>
				</div>

				<!-- Element Selection -->
				<Select
					bind:value={element}
					options={elementOptions}
					label="Element"
					placeholder="Select an element"
					fullWidth
					contained
				/>

				<!-- Gender Selection -->
				<Select
					bind:value={gender}
					options={genderOptions}
					label="Gender"
					placeholder="Select gender"
					fullWidth
					contained
				/>

				<!-- Language Selection -->
				<Select
					bind:value={language}
					options={languageOptions}
					label="Language"
					placeholder="Select language"
					fullWidth
					contained
				/>

				<!-- Theme Selection -->
				<Select
					bind:value={theme}
					options={themeOptions}
					label="Theme"
					placeholder="Select theme"
					fullWidth
					contained
				/>

				<!-- Admin Mode (only for admins) -->
				{#if role === 9}
					<div class="switch-field">
						<label for="bahamut-mode">
							<span>Admin Mode</span>
							<Switch bind:checked={bahamut} name="bahamut-mode" />
						</label>
					</div>
				{/if}
			</div>

			<div class="form-actions">
				<Button variant="ghost" onclick={handleClose} disabled={saving}>Cancel</Button>
				<Button type="submit" variant="primary" disabled={saving}>
					{saving ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</form>
	{/snippet}

	{#snippet footer()}
		<!-- Empty footer, actions are in the form -->
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.error-message {
		background-color: rgba(colors.$error, 0.1);
		border: 1px solid colors.$error;
		border-radius: layout.$card-corner;
		color: colors.$error;
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
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

	.switch-field {
		label {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: spacing.$unit-2x;
			background-color: var(--input-bg);
			border-radius: layout.$card-corner;

			span {
				font-size: typography.$font-regular;
				color: var(--text-primary);
			}
		}
	}

	.form-actions {
		display: flex;
		gap: spacing.$unit-2x;
		justify-content: flex-end;
		padding-top: spacing.$unit-2x;
		border-top: 1px solid var(--border-color);
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
