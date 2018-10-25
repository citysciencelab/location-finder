import { Injectable } from '@angular/core';

import { Plot } from '../plot.model';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';
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

  sendSelectPlot(selectedPlot: Plot, criteriaForRadarChart: RadarChartData) {
    const message = {
      type: 'selectPlot',
      plot: selectedPlot,
      chartData: criteriaForRadarChart
    };
    this.sendMessage(message);
  }

  sendSetTopPlots(topPlots: Plot[], chartDatas: RadarChartData[]) {
    const message = {
      type: 'setTopPlots',
      topPlots: topPlots,
      chartDatas: chartDatas
    };
    this.sendMessage(message);
  }

  sendComputerSagt(plot: Plot, chartData: RadarChartData) {
    const message = {
      type: 'computerSagt',
      plot: plot,
      chartData: chartData
    };
    this.sendMessage(message);
  }

  private sendMessage(message: LocalStorageMessage) {
    localStorage.setItem('message', JSON.stringify(message));
    localStorage.removeItem('message');
  }
}
