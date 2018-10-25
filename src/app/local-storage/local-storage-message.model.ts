import { Plot } from '../plot.model';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';

export interface LocalStorageMessage {
  type: string;
  step?: number;
  plot?: Plot;
  topPlots?: Plot[];
  chartData?: RadarChartData;
  chartDatas?: RadarChartData[];
}
