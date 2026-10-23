<script lang="ts">
	/**
	 * Small bookmark indicator that pins to the bottom-right corner of a
	 * portrait/avatar to mark the item as owned in the user's collection.
	 *
	 * Renders a 24×24 colored circle (the user's element color) holding a
	 * 16×16 bookmark icon, surrounded by a 4px ring in the surrounding
	 * surface color so the badge appears to cut into the avatar.
	 *
	 * The parent must be `position: relative` for the absolute positioning
	 * to anchor to it.
	 */
	import { page } from '$app/stores'
	import type { UserCookie } from '$lib/types/UserCookie'
	import Icon from './Icon.svelte'

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	// Mix the user's element color with 85% opacity via relative-color syntax
	// so the badge sits as a tinted disc against the avatar.
	const bgColor = $derived(
		currentUser?.element
			? `rgba(from var(--${currentUser.element}-button-bg) r g b / 85%)`
			: 'rgba(from var(--text-tertiary) r g b / 85%)'
	)
</script>

<span class="collection-badge" style="background-color: {bgColor};" aria-hidden="true">
	<Icon name="bookmark" size={14} />
</span>

<style lang="scss">
	.collection-badge {
		position: absolute;
		bottom: -4px;
		right: -4px;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		// Box-sizing stays content-box so the inner colored circle is exactly
		// 28×28 and the 4px stroke adds a 36×36 hit area against the avatar.
		border: 4px solid var(--sidebar-bg);
		color: white;
		pointer-events: none;
	}
</style>
