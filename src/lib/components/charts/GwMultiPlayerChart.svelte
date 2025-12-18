<svelte:options runes={true} />

<script lang="ts">
	import { Chart } from 'svelte-echarts'
	import { init, CHART_FONT_FAMILY } from './echarts-setup'
	import { formatScore, formatScoreCompact, type PlayerRoundScore } from '$lib/utils/gw'

	interface Props {
		playerScores: Map<string, { name: string; scores: PlayerRoundScore[] }>
		height?: number
	}

	let { playerScores, height = 400 }: Props = $props()

	// Color palette for 30 players
	const colors = [
		'#2563eb',
		'#dc2626',
		'#16a34a',
		'#ca8a04',
		'#9333ea',
		'#0891b2',
		'#ea580c',
		'#db2777',
		'#4f46e5',
		'#65a30d',
		'#0d9488',
		'#be185d',
		'#7c3aed',
		'#b91c1c',
		'#047857',
		'#a16207',
		'#6366f1',
		'#c2410c',
		'#0369a1',
		'#4338ca',
		'#15803d',
		'#b45309',
		'#7e22ce',
		'#e11d48',
		'#059669',
		'#d97706',
		'#8b5cf6',
		'#f43f5e',
		'#10b981',
		'#f59e0b'
	]

	// Get round labels from first player
	const roundLabels = $derived([...playerScores.values()][0]?.scores.map((s) => s.roundLabel) ?? [])

	// Get player list for legend
	const playerList = $derived([...playerScores.values()].map((p) => p.name))

	// Default: top 5 players visible
	const defaultSelected = $derived(
		Object.fromEntries([...playerScores.values()].map((p, i) => [p.name, i < 5]))
	)

	const options = $derived({
		textStyle: { fontFamily: CHART_FONT_FAMILY },
		tooltip: {
			trigger: 'axis' as const,
			formatter: (params: unknown) => {
				const p = params as Array<{
					marker: string
					seriesName: string
					value: number
					name: string
				}>
				if (!p[0]) return ''
				const sorted = [...p].sort((a, b) => b.value - a.value).slice(0, 10)
				const lines = sorted.map(
					(item) => `${item.marker} ${item.seriesName}: ${formatScore(item.value)}`
				)
				return `${p[0].name}<br/>${lines.join('<br/>')}`
			}
		},
		legend: {
			type: 'scroll' as const,
			bottom: 0,
			data: playerList,
			selected: defaultSelected
		},
		grid: {
			left: 48,
			right: 16,
			top: 24,
			bottom: 80
		},
		xAxis: {
			type: 'category' as const,
			data: roundLabels,
			axisLabel: { fontSize: 11 }
		},
		yAxis: {
			type: 'value' as const,
			axisLabel: {
				formatter: (v: number) => formatScoreCompact(v),
				fontSize: 11
			}
		},
		series: [...playerScores.entries()].map(([, player], i) => ({
			name: player.name,
			type: 'line' as const,
			data: player.scores.map((s) => s.cumulative),
			smooth: true,
			symbol: 'circle',
			symbolSize: 6,
			itemStyle: { color: colors[i % colors.length] },
			lineStyle: { width: 2 }
		}))
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
