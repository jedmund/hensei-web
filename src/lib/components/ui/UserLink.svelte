<script lang="ts">
	/** A user's avatar and name (or `label`), linking to their profile */
	import UserAvatar from './UserAvatar.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { AvatarUser } from '$lib/utils/avatar'

	interface Props {
		user: AvatarUser
		label?: string | undefined
	}

	let { user, label }: Props = $props()
</script>

<a href={localizeHref(`/${user.username}`)} class="creator-link">
	<UserAvatar {user} />
	<span class="username">{label ?? user.username}</span>
</a>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.creator-link {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		text-decoration: none;
		color: var(--text-secondary);
		width: fit-content;

		&:hover {
			color: var(--text-primary);

			.username {
				text-decoration: underline;
			}
		}
	}

	.username {
		font-size: $font-small;
		font-weight: $medium;
	}
</style>
