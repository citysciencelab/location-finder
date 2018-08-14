import { Component, ElementRef, Input, OnInit, OnChanges, Inject, LOCALE_ID, ViewChild } from '@angular/core';
import * as Chart from 'chart.js';
import { ConfigurationService } from '../../configuration.service';
import { RadarChartData } from './radar-chart-data.model';

// This declaration extends the chart.js type definitions (which are inaccurate)
declare module 'chart.js' {
  interface ChartOptions {
    scale?: ChartScales;
  }
  interface ChartScales {
    pointLabels?: PointLabelOptions;
  }
}

@Component({
  selector: 'app-radar-chart',
  templateUrl: './radar-chart.component.html',
  styleUrls: ['./radar-chart.component.css']
})
export class RadarChartComponent implements OnInit, OnChanges {
  @ViewChild('chartCanvas') canvasRef: ElementRef;
  private ctx: CanvasRenderingContext2D;
  private chart: Chart;

  @Input() private chartDatas: RadarChartData[] = [];

  constructor(@Inject(LOCALE_ID) private locale, private config: ConfigurationService) { }

  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');

    this.chart = new Chart(this.ctx, {
      type: 'radar',
      data: {
        labels: this.config.searchCriteria.map(criterion => criterion['name_' + this.locale]),
        datasets: []
      },
      options: {
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
          pointLabels: {
            fontSize: 18
          }
        }
      }
    });
  }

  ngOnChanges() {
    if (!this.chart) {
      return;
    }

    this.chart.data.datasets = this.chartDatas.map(chartData => {
      if (!chartData) {
        return {};
      }
      return {
        label: chartData.className,
        data: chartData.axes.map(axis => axis.value),
        backgroundColor: this.getBackgroundColor(chartData),
        borderColor: this.getBorderColor(chartData)
      };
    });
    this.chart.update();
  }

  getBackgroundColor(chartData: RadarChartData) {
    return chartData.className === 'target-values' ? 'rgba(31, 119, 180, 0.6)' : 'rgba(255, 127, 14, 0.6)';
  }

  getBorderColor(chartData) {
    return chartData.className === 'target-values' ? 'rgba(31, 119, 180, 1)' : 'rgba(255, 127, 14, 1)';
  }
}
