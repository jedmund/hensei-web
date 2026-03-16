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

	<p class="browse-link">{m.error_or_browse_gallery()} <a href={localizeHref('/teams/explore')}>{m.error_gallery()}</a></p>
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
</style>
