import { Feature } from './feature.model';
import { RadarChartData } from './infoscreen/radar-chart/radar-chart-data.model';

export interface LocalStorageMessage {
  type: string;
  step?: number;
  feature?: Feature;
  topFeatures?: Feature[];
  chartData?: RadarChartData;
  chartDatas?: RadarChartData[];
}
