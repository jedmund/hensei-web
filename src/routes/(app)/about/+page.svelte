<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	export let data: { status: unknown; seo: string }
</script>

<svelte:head>{@html data.seo}</svelte:head>

<h1>{m.hello_world({ name: 'World' })}</h1>
<pre>{JSON.stringify(data, null, 2)}</pre>
