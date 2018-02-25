import { Component, ViewChild } from '@angular/core';
import { Feature } from '../feature.model';
import { RadarChartComponent } from './radar-chart/radar-chart.component';
import { RadarChartData } from './radar-chart/radar-chart-data.model';
import { RadarChartOptions } from './radar-chart/radar-chart-options.model';
import { LocalStorageMessage } from '../local-storage-message.model';

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
  radarChartOptions: RadarChartOptions = {
    w: 600,
    h: 600,
    levels: 5,
    maxValue: 1,
    minValue: 0
  };
  radarChartOptionsCompare: RadarChartOptions = {
    w: 200,
    h: 200,
    levels: 5,
    maxValue: 1,
    minValue: 0
  };
  @ViewChild(RadarChartComponent) radarChart: RadarChartComponent;

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
