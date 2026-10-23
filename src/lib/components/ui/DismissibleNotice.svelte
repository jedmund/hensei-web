<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ComponentProps } from 'svelte'
	import { onMount } from 'svelte'
	import Notice from './Notice.svelte'
	import { notices, type NoticeId } from '$lib/stores/notices.svelte'

	interface Props {
		id: NoticeId
		variant?: ComponentProps<typeof Notice>['variant']
		icon?: Snippet
		badge?: string
		children: Snippet
		action?: Snippet
		class?: string
	}

	let { id, variant, icon, badge, children, action, class: className }: Props = $props()

	// Dismissal lives in localStorage, so render only on the client; otherwise a
	// dismissed notice would flash in from the server render.
	let mounted = $state(false)
	onMount(() => {
		mounted = true
	})
</script>

{#if mounted && notices.isActive(id)}
	<Notice
		{variant}
		{icon}
		{badge}
		{children}
		{action}
		class={className}
		onDismiss={() => notices.dismiss(id)}
	/>
{/if}
