<!--
	Mounts an ECharts instance, applies `options` whenever they change and
	resizes with its container. Uses the tree-shaken build from echarts-setup.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { init, type ChartOptions, type ChartInstance } from './echarts-setup'

	interface Props {
		options: ChartOptions
	}

	let { options }: Props = $props()

	let element: HTMLDivElement
	let chart = $state<ChartInstance>()

	$effect(() => {
		chart?.setOption(options, { notMerge: true })
	})

	onMount(() => {
		chart = init(element)
		const resizeObserver = new ResizeObserver(() => chart?.resize())
		resizeObserver.observe(element)

		return () => {
			resizeObserver.disconnect()
			chart?.dispose()
		}
	})
</script>

<div bind:this={element} class="chart"></div>

<style lang="scss">
	.chart {
		width: 100%;
		height: 100%;
	}
</style>
