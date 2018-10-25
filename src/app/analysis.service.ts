import { Injectable } from '@angular/core';

import { ConfigurationService } from './configuration.service';
import { Plot } from './plot.model';
import { RadarChartData } from './radar-chart/radar-chart-data.model';

@Injectable()
export class AnalysisService {
  allPlots: Plot[] = [];
  topPlots: Plot[] = [];
  maxValues: { [key: string]: number } = {};
  targetCriteria: RadarChartData;

  constructor(private config: ConfigurationService) {
    this.targetCriteria = new RadarChartData(
      'target-values',
      this.config.searchCriteria.map(item => ({ name: item.key, value: 0 }))
    );
  }

  setAllPlots(features: ol.Feature[]): void {
    this.allPlots = features.map(feature => new Plot(feature));
  }

  calculateMaxValues(): void {
    this.config.searchCriteria.forEach(item => {
      this.allPlots.forEach(plot => {
        this.maxValues[item.key] = Math.max(this.maxValues[item.key] || 0, parseInt(plot.properties[item.key], 10) || 0);
      });
    });
  }

  updateTargetCriteria(key: string, value: number): void {
    this.targetCriteria.findAxisByKey(key).value = value;
    this.targetCriteria = new RadarChartData(this.targetCriteria.className, this.targetCriteria.axes);
  }

  lockPlot(plot: Plot): void {
    this.topPlots.push(plot);
  }

  unlockPlot(plot: Plot): void {
    this.topPlots.splice(this.topPlots.findIndex(item => item.id === plot.id), 1);
  }

  normalizeLocationValues(plot: Plot): { name: string; value: number }[] {
    if (!this.maxValues || this.maxValues.length === 0) {
      throw new Error('max values are not defined');
    }

    return this.config.searchCriteria.map(item => ({
      name: item.key,
      value: plot.properties[item.key] / this.maxValues[item.key]
    }));
  }

  findTopPlotById(id: string | number): Plot {
    return this.topPlots.find(item => item.id === id);
  }

  /*
   * Returns the plot whose properties exhibit the greatest similarity with the targetCriteria
   */
  getBestPlot(): Plot {
    let minEuclideanDistance = Infinity;
    let bestPlot: Plot;

    for (const plot of this.allPlots) {
      const normalizedValues = this.normalizeLocationValues(plot);
      const sum = normalizedValues
        .map(axis => {
          const targetAxis = this.targetCriteria.findAxisByKey(axis.name);
          return Math.pow(axis.value - targetAxis.value, 2);
        })
        .reduce((previous, current) => previous + current, 0);
      const euclideanDistance = Math.sqrt(sum);

      if (euclideanDistance < minEuclideanDistance) {
        minEuclideanDistance = euclideanDistance;
        bestPlot = plot;
      }
    }

    return bestPlot;
  }
}
