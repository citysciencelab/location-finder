import { Injectable } from '@angular/core';
import { Feature } from './feature.model';
import { RadarChartData } from './infoscreen/radar-chart/radar-chart-data.model';
import { LocalStorageMessage } from './local-storage-message.model';

@Injectable()
export class LocalStorageService {

  constructor() { }

  sendSetProgress(newStep: number) {
    const message = {
      type: 'setProgress',
      step: newStep
    };
    this.sendMessage(message);
  }

  sendSetCriteria(chartData: RadarChartData) {
    const message = {
      type: 'setCriteria',
      chartData: chartData
    };
    this.sendMessage(message);
  }

  sendSelectFeature(selectedFeature: Feature, criteriaForRadarChart: RadarChartData) {
    const message = {
      type: 'selectFeature',
      feature:  selectedFeature,
      chartData: criteriaForRadarChart
    };
    this.sendMessage(message);
  }

  sendSetTopFeatures(topFeatures: Feature[], chartDatas: RadarChartData[]) {
    const message = {
      type: 'setTopFeatures',
      topFeatures: topFeatures,
      chartDatas: chartDatas
    };
    this.sendMessage(message);
  }

  sendComputerSagt(feature: Feature, chartData: RadarChartData) {
    const message = {
      type: 'computerSagt',
      feature: feature,
      chartData: chartData
    };
    this.sendMessage(message);
  }

  private sendMessage(message: LocalStorageMessage) {
    localStorage.setItem('message', JSON.stringify(message));
    localStorage.removeItem('message');
  }
}
