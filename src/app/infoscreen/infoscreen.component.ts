import { Component } from '@angular/core';
import { Feature } from '../feature.model';
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
  selectedFeature: Feature;
  selectedFeatureChartData: RadarChartData;
  topFeatures: Feature[] = [];
  topFeaturesToDisplay: Feature[] = [];
  topFeaturesChartDatas: RadarChartData[] = [];
  targetChartData: RadarChartData;
  comparisonChartOptions: Chart.ChartOptions = {
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

  isSelectedFeatureLocked() {
    return this.selectedFeature && this.topFeatures.find(item => item.id === this.selectedFeature.id);
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

      case 'selectFeature':
        if (!message.feature) {
          break;
        }
        this.selectedFeature = message.feature;
        this.selectedFeatureChartData = message.chartData;
        break;

      case 'setTopFeatures':
        if (!message.topFeatures) {
          break;
        }
        this.topFeatures = message.topFeatures;
        this.topFeaturesToDisplay = this.topFeatures.slice(0, 3);
        this.topFeaturesChartDatas = message.chartDatas;
        break;

      case 'setCriteria':
        this.targetChartData = message.chartData;
        break;

      case 'computerSagt':
        if (!message.feature) {
          break;
        }
        this.selectedFeature = message.feature;
        this.selectedFeatureChartData = message.chartData;
        break;
    }
  }
}
