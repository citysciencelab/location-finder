import { Component } from '@angular/core';

import { Plot } from '../plot.model';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';
import { LocalStorageMessage } from '../local-storage/local-storage-message.model';

// This declaration extends the chart.js type definitions (which are inaccurate)
declare module 'chart.js' {
  interface PointLabelOptions {
    display?: boolean;
  }
}

@Component({
  selector: 'app-infoscreen',
  templateUrl: './infoscreen.component.html',
  styleUrls: ['./infoscreen.component.css']
})
export class InfoscreenComponent {
  progress = 0;
  selectedPlot: Plot;
  selectedPlotChartData: RadarChartData;
  topPlots: Plot[] = [];
  topPlotsToDisplay: Plot[] = [];
  topPlotsChartDatas: RadarChartData[] = [];
  targetChartData: RadarChartData;
  comparisonChartOptions: any = {
    legend: {
      display: false
    },
    animation: {
      duration: 0
    },
    scale: {
      ticks: {
        max: 1,
        min: 0,
        display: false
      },
      gridLines: {
        color: '#aaa',
        lineWidth: 1
      },
      pointLabels: {
        display: false
      }
    }
  };

  constructor() { }

  isSelectedPlotLocked() {
    return this.selectedPlot && this.topPlots.find(item => item.id === this.selectedPlot.id);
  }

  receiveMapEvent(event: StorageEvent) {
    if (event.key !== 'message') {
      return;
    }
    const message = <LocalStorageMessage>JSON.parse(event.newValue);
    if (!message) {
      return;
    }

    switch (message.type) {
      case 'setProgress':
        this.progress = message.step;
        break;

      case 'selectPlot':
        if (!message.plot) {
          break;
        }
        this.selectedPlot = message.plot;
        this.selectedPlotChartData = message.chartData;
        break;

      case 'setTopPlots':
        if (!message.topPlots) {
          break;
        }
        this.topPlots = message.topPlots;
        this.topPlotsToDisplay = this.topPlots.slice(0, 3);
        this.topPlotsChartDatas = message.chartDatas;
        break;

      case 'setCriteria':
        this.targetChartData = message.chartData;
        break;

      case 'computerSagt':
        if (!message.plot) {
          break;
        }
        this.selectedPlot = message.plot;
        this.selectedPlotChartData = message.chartData;
        break;
    }
  }
}
