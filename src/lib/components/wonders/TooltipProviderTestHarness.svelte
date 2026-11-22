<!-- Test-only: a pane inside the Tooltip.Provider the app layout supplies. -->
<script lang="ts">
	import { Tooltip } from 'bits-ui'
	import type { Component } from 'svelte'

	const {
		component: Pane,
		paneProps
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>
		paneProps: Record<string, unknown>
	} = $props()
</script>

<Tooltip.Provider><Pane {...paneProps} /></Tooltip.Provider>
