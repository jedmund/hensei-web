<script lang="ts">
	/** In the sticker picker for signed-out viewers: sign up or log in to give stickers */
	import { goto } from '$app/navigation'
	import Button from '$lib/components/ui/Button.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'
</script>

<div class="sign-in">
	<p>{m.sticker_sign_in_prompt()}</p>
	<div class="actions">
		<Button variant="primary" size="small" onclick={() => goto(localizeHref('/auth/register'))}>
			{m.sticker_sign_up()}
		</Button>
		<Button variant="secondary" size="small" onclick={() => goto(localizeHref('/auth/login'))}>
			{m.sticker_log_in()}
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.sign-in {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.actions {
		display: flex;
		gap: spacing.$unit;
	}
</style>
