import { RadarChartAxis } from './radar-chart-axis.model';

export class RadarChartData {
  className: string;
  axes: RadarChartAxis[];

  constructor(className, axes) {
    this.className = className;
    this.axes = axes;
  }

  findAxisByKey(key: string) {
    return this.axes.find(axis => axis.name === key);
  }
}
