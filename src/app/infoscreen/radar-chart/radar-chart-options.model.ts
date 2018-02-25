import { RadarChartData } from './radar-chart-data.model';

export interface RadarChartOptions {
  containerClass?: string;
  w?: number;
  h?: number;
  factor?: number;
  factorLegend?: number;
  levels?: number;
  levelTick?: boolean;
  tickLength?: number;
  maxValue?: number;
  minValue?: number;
  radians?: number;
  color?: d3.scale.Ordinal<string, string>;
  axisLine?: boolean;
  axisText?: boolean;
  circles?: boolean;
  radius?: number;
  backgroundTooltipColor?: string;
  backgroundTooltipOpacity?: string;
  tooltipColor?: string;
  axisJoin?: (d: RadarChartData, i: number) => string;
  tooltipFormatValue?: (d: number) => string;
  tooltipFormatClass?: (d: string) => string;
  transitionDuration?: number;
}
