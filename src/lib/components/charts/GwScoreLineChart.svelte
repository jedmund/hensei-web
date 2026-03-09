<!--
  DORMANT COMPONENT — Currently unused.
  Origin: Scaffolded for GW (Guild War) individual player score charts.
  Intended feature: Display per-round cumulative score line charts on crew/player GW pages.
  Never wired up to any route or parent component.
-->

<script lang="ts">
	import { Chart } from 'svelte-echarts'
	import { init, CHART_FONT_FAMILY, CHART_SPLIT_LINE, CHART_AXIS_LINE, CHART_LABEL_COLOR } from './echarts-setup'
	import { formatScore, formatScoreCompact, type PlayerRoundScore } from '$lib/utils/gw'

	interface Props {
		data: PlayerRoundScore[]
		title?: string
		height?: number
	}

	let { data, title, height = 300 }: Props = $props()

	const options = $derived({
		textStyle: { fontFamily: CHART_FONT_FAMILY, color: CHART_LABEL_COLOR },
		title: title
			? { text: title, left: 'center', textStyle: { fontSize: 14, fontFamily: CHART_FONT_FAMILY, color: CHART_LABEL_COLOR } }
			: undefined,
		tooltip: {
			trigger: 'axis' as const,
			formatter: (params: unknown) => {
				const p = params as Array<{ name: string; value: number }>
				const point = p[0]
				if (!point) return ''
				return `${point.name}<br/>Score: ${formatScore(point.value)}`
			}
		},
		grid: {
			left: 48,
			right: 16,
			top: title ? 40 : 24,
			bottom: 40
		},
		xAxis: {
			type: 'category' as const,
			data: data.map((d) => d.roundLabel),
			axisLabel: { rotate: 45, fontSize: 11, color: CHART_LABEL_COLOR },
			axisLine: CHART_AXIS_LINE
		},
		yAxis: {
			type: 'value' as const,
			axisLabel: {
				formatter: (v: number) => formatScoreCompact(v),
				fontSize: 11,
				color: CHART_LABEL_COLOR
			},
			splitLine: CHART_SPLIT_LINE
		},
		series: [
			{
				type: 'line' as const,
				data: data.map((d) => d.cumulative),
				smooth: true,
				symbol: 'circle',
				symbolSize: 8,
				lineStyle: { width: 2, color: '#2563eb' },
				itemStyle: { color: '#2563eb' },
				areaStyle: { opacity: 0.1, color: '#2563eb' }
			}
		]
	})
</script>

<div class="chart-container" style:height="{height}px">
	<Chart {init} {options} />
</div>

<style lang="scss">
	.chart-container {
		width: 100%;
	}
</style>
