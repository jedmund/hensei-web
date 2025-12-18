<svelte:options runes={true} />

<script lang="ts">
	import { Chart } from 'svelte-echarts'
	import { init, CHART_FONT_FAMILY } from './echarts-setup'
	import { formatScore, formatScoreCompact, type HistoryDataPoint } from '$lib/utils/gw'

	interface Props {
		data: HistoryDataPoint[]
		height?: number
	}

	let { data, height = 350 }: Props = $props()

	// Calculate ~2 years of events (roughly 12 GWs per year = 24 events)
	const defaultViewportSize = 24
	const startPercent = $derived(
		data.length > defaultViewportSize
			? ((data.length - defaultViewportSize) / data.length) * 100
			: 0
	)

	const options = $derived({
		textStyle: { fontFamily: CHART_FONT_FAMILY },
		tooltip: {
			trigger: 'axis' as const,
			formatter: (params: unknown) => {
				const p = params as Array<{ name: string; value: number; dataIndex: number }>
				const point = p[0]
				if (!point) return ''
				const dataPoint = data[point.dataIndex]
				return `${point.name}<br/>Score: ${formatScore(point.value)}<br/>${dataPoint?.date ?? ''}`
			}
		},
		toolbox: {
			feature: {
				dataZoom: {
					yAxisIndex: 'none' as const,
					title: { zoom: 'Zoom', back: 'Reset' }
				},
				restore: { title: 'Reset' }
			},
			right: 20
		},
		dataZoom: [
			{
				type: 'slider' as const,
				xAxisIndex: 0,
				start: startPercent,
				end: 100,
				height: 30,
				bottom: 10,
				borderColor: 'transparent',
				backgroundColor: 'rgba(0,0,0,0.05)',
				fillerColor: 'rgba(37,99,235,0.2)',
				handleStyle: { color: '#2563eb' }
			},
			{
				type: 'inside' as const,
				xAxisIndex: 0,
				start: startPercent,
				end: 100,
				zoomOnMouseWheel: 'shift',
				moveOnMouseMove: true,
				moveOnMouseWheel: true
			}
		],
		grid: {
			left: 48,
			right: 16,
			bottom: 80,
			top: 40
		},
		xAxis: {
			type: 'category' as const,
			data: data.map((d) => d.eventLabel),
			axisLabel: {
				rotate: 45,
				interval: 'auto' as const,
				fontSize: 11
			}
		},
		yAxis: {
			type: 'value' as const,
			axisLabel: {
				formatter: (v: number) => formatScoreCompact(v),
				fontSize: 11
			}
		},
		series: [
			{
				type: 'line' as const,
				data: data.map((d) => d.totalScore),
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

<div class="chart-wrapper">
	<div class="chart-container" style:height="{height}px">
		<Chart {init} {options} />
	</div>
	<p class="chart-hint">Drag to pan &bull; Shift+scroll to zoom &bull; Use slider below chart</p>
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.chart-wrapper {
		width: 100%;
	}

	.chart-container {
		width: 100%;
	}

	.chart-hint {
		text-align: center;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 4px 0 0;
	}
</style>
