
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { Chart } from 'svelte-echarts'
	import { init, CHART_FONT_FAMILY, CHART_SPLIT_LINE, CHART_AXIS_LINE, CHART_LABEL_COLOR } from './echarts-setup'
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

	// Check if data has any gaps
	const hasGaps = $derived(data.some((d) => d.isGap))

	// Build gap connection data: only show values at gap boundaries for dashed line
	// This creates a dashed line connecting across gaps
	const gapConnectionData = $derived.by(() => {
		if (!hasGaps) return []

		const result: (number | null)[] = []
		for (let i = 0; i < data.length; i++) {
			const current = data[i]
			const prev = data[i - 1]
			const next = data[i + 1]

			// Include this point if it's adjacent to a gap
			const isBeforeGap = !current?.isGap && next?.isGap
			const isAfterGap = !current?.isGap && prev?.isGap

			if (isBeforeGap || isAfterGap) {
				result.push(current?.totalScore ?? null)
			} else {
				result.push(null)
			}
		}
		return result
	})

	const options = $derived({
		textStyle: { fontFamily: CHART_FONT_FAMILY, color: CHART_LABEL_COLOR },
		tooltip: {
			trigger: 'axis' as const,
			formatter: (params: unknown) => {
				const p = params as Array<{ name: string; value: number | null; dataIndex: number }>
				const point = p[0]
				if (!point) return ''
				const dataPoint = data[point.dataIndex]
				if (dataPoint?.isGap) {
					return `${point.name}<br/><span style="color: var(--text-tertiary)">${m.gw_chart_not_in_crew()}</span><br/>${dataPoint?.date ?? ''}`
				}
				return `${point.name}<br/>${m.gw_chart_score_label({ score: formatScore(point.value ?? 0) })}<br/>${dataPoint?.date ?? ''}`
			}
		},
		toolbox: {
			feature: {
				dataZoom: {
					yAxisIndex: 'none' as const,
					title: { zoom: m.gw_chart_zoom(), back: m.gw_chart_reset() }
				},
				restore: { title: m.gw_chart_reset() }
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
				fontSize: 11,
				color: CHART_LABEL_COLOR
			},
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
			// Main series: solid line, breaks at gaps (null values)
			{
				type: 'line' as const,
				data: data.map((d) => d.totalScore),
				smooth: true,
				symbol: 'circle',
				symbolSize: 8,
				connectNulls: false,
				lineStyle: { width: 2, color: '#2563eb' },
				itemStyle: { color: '#2563eb' },
				areaStyle: { opacity: 0.1, color: '#2563eb' }
			},
			// Gap connection series: dashed line connecting across gaps
			...(hasGaps
				? [
						{
							type: 'line' as const,
							data: gapConnectionData,
							smooth: true,
							symbol: 'none',
							connectNulls: true,
							lineStyle: { width: 1.5, color: '#94a3b8', type: 'dashed' as const },
							z: 0 // Behind the main series
						}
					]
				: [])
		]
	})
</script>

<div class="chart-wrapper">
	<div class="chart-container" style:height="{height}px">
		<Chart {init} {options} />
	</div>
	<p class="chart-hint">{m.gw_chart_hint()}</p>
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
