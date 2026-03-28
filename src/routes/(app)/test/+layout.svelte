<script lang="ts">
	// Simple layout for test pages
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()
</script>

<div class="test-layout">
	{@render children()}
</div>

<style>
	.test-layout {
		min-height: 100vh;
		background: var(--background);
		color: var(--text-primary);
	}
</style>
