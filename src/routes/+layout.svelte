<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import Navigation from '$lib/components/Navigation.svelte'

	// Get `data` and `children` from the router via $props()
	const { data, children } = $props<{
		data: {
			isAuthenticated: boolean
			account: { username: string; userId: string; role: number } | null
			currentUser: unknown | null
		}
		children: () => any
	}>()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	<Navigation isAuthenticated={data?.isAuthenticated} username={data?.account?.username} />
	{@render children?.()}
</main>
