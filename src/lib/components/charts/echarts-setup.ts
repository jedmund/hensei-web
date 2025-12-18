/**
 * ECharts Setup Module
 *
 * Configures tree-shaking for ECharts by only importing the components we need.
 * This keeps the bundle size reasonable while providing full chart functionality.
 */

import { init, use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
	GridComponent,
	TooltipComponent,
	LegendComponent,
	TitleComponent,
	DataZoomComponent,
	ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register only the components we need
use([
	LineChart,
	GridComponent,
	TooltipComponent,
	LegendComponent,
	TitleComponent,
	DataZoomComponent,
	ToolboxComponent,
	CanvasRenderer
])

// Shared font family matching the app's typography
export const CHART_FONT_FAMILY = "'AGrot', system-ui, sans-serif"

export { init }
