<!-- A user's avatar for Recently opened, from the user's Database record (shared cache with its detail page) -->

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
	import { userRecordQuery } from '$lib/features/database/users/record'

	interface Props {
		userId: string
		size: number
	}

	const { userId, size }: Props = $props()

	// While it loads, or if the user is gone, UserAvatar shows its empty circle
	const query = createQuery(() => ({
		...userRecordQuery(userId),
		staleTime: 1000 * 60 * 5,
		retry: false
	}))
</script>

<UserAvatar user={query.data ?? {}} {size} />
