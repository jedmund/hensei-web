<script lang="ts">
	import { page } from '$app/stores'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
</script>

<div class="error-container">
	<div class="error-message">
		<span class="status-code">{$page.status}</span>
		<h1>{m.error_something_went_wrong()}</h1>
	</div>

	<p class="browse-link">
		{m.error_or_browse_gallery()}
		<a href={localizeHref('/teams/explore')}>{m.error_gallery()}</a>
	</p>

	<p class="clear-hint">{m.error_boundary_clear_hint()}</p>
	<button
		class="clear-button"
		onclick={() => {
			try {
				localStorage.clear()
				document.cookie.split(';').forEach((c) => {
					const name = c.trim().split('=')[0]
					if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
				})
			} catch {
				// Best effort
			}
			window.location.reload()
		}}
	>
		{m.error_boundary_clear_button()}
	</button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: spacing.$unit-4x;
		color: var(--text-primary);
	}

	.error-message {
		text-align: center;

		.status-code {
			display: block;
			font-size: 4.8rem;
			font-weight: typography.$medium;
			color: var(--text-tertiary);
			line-height: 1;
			margin: 0 0 spacing.$unit;
		}

		h1 {
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
			margin: 0;
		}
	}

	.browse-link {
		color: var(--text-secondary);
		font-size: typography.$font-body;
		margin-top: spacing.$unit-3x;

		a {
			color: var(--link);
			text-decoration: none;
			font-weight: typography.$medium;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.clear-hint {
		color: var(--text-tertiary);
		font-size: typography.$font-small;
		margin: spacing.$unit-3x 0 0;
	}

	.clear-button {
		all: unset;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: spacing.$unit calc(spacing.$unit * 2);
		border-radius: 6px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		font-family: inherit;
		margin-top: spacing.$unit;
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--button-bg);

		&:hover {
			background: var(--button-bg);
			color: var(--text-primary);
		}
	}
</style>
