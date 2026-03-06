<svelte:options runes={true} />

<script lang="ts">
	import { Chart } from 'svelte-echarts'
	import { init, CHART_FONT_FAMILY, CHART_SPLIT_LINE, CHART_AXIS_LINE, CHART_LABEL_COLOR } from './echarts-setup'
	import { formatScore, formatScoreCompact } from '$lib/utils/gw'
	import type { GwChartDataPoint } from '$lib/types/api/gw'

	interface Props {
		data: GwChartDataPoint[]
		height?: number
	}

	let { data, height = 300 }: Props = $props()

	const options = $derived({
		textStyle: { fontFamily: CHART_FONT_FAMILY, color: CHART_LABEL_COLOR },
		tooltip: {
			trigger: 'axis' as const,
			formatter: (params: unknown) => {
				const p = params as Array<{ seriesName: string; value: number; name: string }>
				if (!p[0]) return ''
				const crew = p.find((item) => item.seriesName === 'Our Crew')
				const opp = p.find((item) => item.seriesName === 'Opponent')
				return `${p[0].name}<br/>Our Crew: ${formatScore(crew?.value ?? 0)}<br/>Opponent: ${formatScore(opp?.value ?? 0)}`
			}
		},
		legend: {
			data: ['Our Crew', 'Opponent'],
			bottom: 0,
			textStyle: { color: CHART_LABEL_COLOR }
		},
		grid: {
			left: 48,
			right: 16,
			top: 24,
			bottom: 48
		},
		xAxis: {
			type: 'category' as const,
			data: data.map((d) => d.roundLabel),
			axisLabel: { fontSize: 11, color: CHART_LABEL_COLOR },
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
				name: 'Our Crew',
				type: 'line' as const,
				data: data.map((d) => d.crewScore),
				smooth: true,
				symbol: 'circle',
				symbolSize: 8,
				lineStyle: { width: 2, color: '#2563eb' },
				itemStyle: { color: '#2563eb' }
			},
			{
				name: 'Opponent',
				type: 'line' as const,
				data: data.map((d) => d.opponentScore),
				smooth: true,
				symbol: 'diamond',
				symbolSize: 8,
				lineStyle: { width: 2, color: '#dc2626' },
				itemStyle: { color: '#dc2626' }
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
