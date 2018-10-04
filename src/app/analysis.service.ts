import { Injectable } from '@angular/core';

import { ConfigurationService } from './configuration.service';
import { Feature } from './feature.model';
import { RadarChartData } from './radar-chart/radar-chart-data.model';

@Injectable()
export class AnalysisService {
  allFeatures: Feature[] = [];
  topFeatures: Feature[] = [];
  maxValues: { [key: string]: number } = {};
  targetCriteria: RadarChartData;

  constructor(private config: ConfigurationService) {
    this.targetCriteria = new RadarChartData(
      'target-values',
      this.config.searchCriteria.map(item => ({ name: item.key, value: 0 }))
    );
  }

  setAllFeatures(features: Feature[]): void {
    this.allFeatures = features;
  }

  calculateMaxValues(): void {
    this.config.searchCriteria.forEach(item => {
      this.allFeatures.forEach(feature => {
        this.maxValues[item.key] = Math.max(this.maxValues[item.key] || 0, parseInt(feature.properties[item.key], 10) || 0);
      });
    });
  }

  updateTargetCriteria(key: string, value: number): void {
    this.targetCriteria.findAxisByKey(key).value = value;
    this.targetCriteria = new RadarChartData(this.targetCriteria.className, this.targetCriteria.axes);
  }

  lockFeature(feature: Feature): void {
    console.log('lock');
    this.topFeatures.push(feature);
    feature.olFeature.setStyle(feature.layer.olExtraStyleFn);
  }

  unlockFeature(feature: Feature): void {
    console.log('unlock');
    this.topFeatures.splice(this.topFeatures.indexOf(feature), 1);
    feature.olFeature.setStyle(feature.layer.olSelectedStyleFn);
  }

  toggleLockFeature(feature: Feature): void {
    const alreadyLocked = this.topFeatures.find(item => item.id === feature.id);
    if (alreadyLocked) {
      this.unlockFeature(feature);
    } else {
      this.lockFeature(feature);
    }
  }

  normalizeLocationValues(feature: Feature): { name: string; value: number }[] {
    if (!this.maxValues || this.maxValues.length === 0) {
      throw new Error('max values are not defined');
    }

    return this.config.searchCriteria.map(item => ({
      name: item.key,
      value: feature.properties[item.key] / this.maxValues[item.key]
    }));
  }

  findTopFeatureById(id: string | number): Feature {
    return this.topFeatures.find(item => item.id === id);
  }

  /*
   * Returns the feature whose properties exhibit the greatest similarity with the targetCriteria
   */
  computerSagt(): Feature {
    let minEuclideanDistance = Infinity;
    let topFeature: Feature;

    for (const feature of this.allFeatures) {
      const normalizedValues = this.normalizeLocationValues(feature);
      const sum = normalizedValues
        .map(axis => {
          const targetAxis = this.targetCriteria.findAxisByKey(axis.name);
          return Math.pow(axis.value - targetAxis.value, 2);
        })
        .reduce((previous, current) => previous + current, 0);
      const euclideanDistance = Math.sqrt(sum);

      if (euclideanDistance < minEuclideanDistance) {
        minEuclideanDistance = euclideanDistance;
        topFeature = feature;
      }
    }

    return topFeature;
  }
}
