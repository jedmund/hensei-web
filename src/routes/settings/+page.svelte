<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Select from '$lib/components/ui/Select.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { pictureData } from '$lib/utils/pictureData'
	import { users } from '$lib/api/resources/users'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { invalidateAll } from '$app/navigation'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Check authentication
	if (!data.account || !data.currentUser) {
		goto('/login')
	}

	const account = data.account!
	const user = data.currentUser!

	// Form state
	let picture = $state(user.picture)
	let gender = $state(user.gender)
	let language = $state(user.language)
	let theme = $state(user.theme)
	let bahamut = $state(user.bahamut ?? false)

	let saving = $state(false)
	let error = $state<string | null>(null)
	let success = $state(false)

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

	// Get current picture data
	const currentPicture = $derived(pictureData.find((p) => p.filename === picture))

	// Handle form submission
	async function handleSave(e: Event) {
		e.preventDefault()
		error = null
		success = false
		saving = true

		try {
			// Prepare the update data
			const updateData = {
				picture,
				element: currentPicture?.element,
				gender,
				language,
				theme
			}

			// Call API to update user settings
			const response = await users.update(fetch, account.userId, updateData)

			// Update the user cookie
			const updatedUser: UserCookie = {
				picture: response.avatar.picture,
				element: response.avatar.element,
				language: response.language,
				gender: response.gender,
				theme: response.theme,
				bahamut
			}

			// Make a request to update the cookie server-side
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatedUser)
			})

			success = true

			// If language or theme changed, we need to reload
			if (user.language !== language || user.theme !== theme || user.bahamut !== bahamut) {
				setTimeout(() => {
					invalidateAll()
					window.location.reload()
				}, 1000)
			}
		} catch (err) {
			console.error('Failed to update settings:', err)
			error = 'Failed to update settings. Please try again.'
		} finally {
			saving = false
		}
	}
</script>

<div class="settings-page">
	<div class="settings-container">
		<h1>Account Settings</h1>
		<p class="username">@{account.username}</p>

		<form onsubmit={handleSave} class="settings-form">
			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			{#if success}
				<div class="success-message">Settings saved successfully!</div>
			{/if}

			<div class="form-fields">
				<!-- Picture Selection with Preview -->
				<div class="picture-section">
					<label>Avatar</label>
					<div class="picture-content">
						<div class="current-avatar">
							<img
								src={`/profile/${picture}.png`}
								srcset={`/profile/${picture}.png 1x, /profile/${picture}@2x.png 2x`}
								alt={currentPicture?.name[locale] || ''}
								class="avatar-preview element-{currentPicture?.element}"
							/>
						</div>
						<Select
							bind:value={picture}
							options={pictureOptions}
							placeholder="Select an avatar"
							fullWidth
						/>
					</div>
				</div>

				<!-- Gender Selection -->
				<div class="form-field">
					<Select
						bind:value={gender}
						options={genderOptions}
						label="Gender"
						placeholder="Select gender"
						fullWidth
					/>
				</div>

				<!-- Language Selection -->
				<div class="form-field">
					<Select
						bind:value={language}
						options={languageOptions}
						label="Language"
						placeholder="Select language"
						fullWidth
					/>
				</div>

				<!-- Theme Selection -->
				<div class="form-field">
					<Select
						bind:value={theme}
						options={themeOptions}
						label="Theme"
						placeholder="Select theme"
						fullWidth
					/>
				</div>

				<!-- Admin Mode (only for admins) -->
				{#if account.role === 9}
					<div class="switch-field">
						<label for="bahamut-mode">
							<span>Admin Mode</span>
							<Switch bind:checked={bahamut} name="bahamut-mode" />
						</label>
					</div>
				{/if}
			</div>

			<div class="form-actions">
					<Button
						variant="ghost"
						href="/me"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
		</form>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.settings-page {
		padding: spacing.$unit-3x;
		max-width: 600px;
		margin: 0 auto;
	}

	.settings-container {
		background-color: var(--card-bg);
		border: effects.$page-border;
		border-radius: layout.$page-corner;
		padding: spacing.$unit-4x;
		box-shadow: effects.$page-elevation;

		h1 {
			font-size: typography.$font-xlarge;
			color: var(--text-primary);
			margin-bottom: spacing.$unit-half;
		}

		.username {
			color: var(--text-secondary);
			font-size: typography.$font-regular;
			margin-bottom: spacing.$unit-4x;
		}
	}

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

	.success-message {
		background-color: rgba(colors.$yellow, 0.1);
		border: 1px solid colors.$yellow;
		border-radius: layout.$card-corner;
		color: colors.$yellow;
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-field {
		display: flex;
		flex-direction: column;
	}

	.picture-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;

		label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-primary);
		}

		.picture-content {
			display: flex;
			gap: spacing.$unit-3x;
			align-items: center;

			.current-avatar {
				flex-shrink: 0;
				width: 100px;
				height: 100px;

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
</style>
