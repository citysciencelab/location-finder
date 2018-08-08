import { Component, ElementRef, Input, OnChanges, Inject, LOCALE_ID, ViewChild } from '@angular/core';
import * as Chart from 'chart.js';
import { ConfigurationService } from '../../configuration.service';
import { RadarChartAxis } from './radar-chart-axis.model';
import { RadarChartData } from './radar-chart-data.model';
import { RadarChartOptions } from './radar-chart-options.model';

// This declaration extends the chart.js type definiion
declare module 'chart.js' {
  interface ChartOptions {
    scale?: ChartScales;
  }
}

@Component({
  selector: 'app-radar-chart',
  templateUrl: './radar-chart.component.html',
  styleUrls: ['./radar-chart.component.css']
})
export class RadarChartComponent implements OnChanges {
  @ViewChild('chartCanvas') canvasRef: ElementRef;
  private ctx: CanvasRenderingContext2D;
  private chart: Chart;

  @Input() private className: string;
  @Input() private chartDatas: RadarChartData[] = [];
  @Input() private chartOptions: RadarChartOptions = {};

  // private defaultConfig: RadarChartOptions = {
  //   containerClass: 'radar-chart',
  //   w: 600,
  //   h: 600,
  //   factor: 0.95,
  //   factorLegend: 1,
  //   levels: 3,
  //   levelTick: false,
  //   tickLength: 10,
  //   maxValue: 0,
  //   minValue: 0,
  //   radians: 2 * Math.PI,
  //   color: d3.scale.category10(),
  //   axisLine: true,
  //   axisText: true,
  //   circles: true,
  //   radius: 5,
  //   backgroundTooltipColor: '#555',
  //   backgroundTooltipOpacity: '0.7',
  //   tooltipColor: 'white',
  //   axisJoin: (d: RadarChartData, i: number) => d.className || i.toString(),
  //   tooltipFormatValue: (d: number) => d.toString(),
  //   tooltipFormatClass: (d: string) => d,
  //   transitionDuration: 300
  // };
  // private svgSelection: d3.Selection<SVGElement>;
  // private total: number;

  constructor(@Inject(LOCALE_ID) private locale, private elementRef: ElementRef, private config: ConfigurationService) { }

  ngOnChanges() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');

    const chartConfiguration: Chart.ChartConfiguration = {
      type: 'radar',
      data: {
        labels: ['Park_m2', 'Fitness', 'Gastro', 'Kultur', 'Scientific', 'AIR_OEV'],
        datasets: this.chartDatas.map(chartData => {
          if (!chartData) {
            return {};
          }
          return {
            label: chartData.className,
            data: chartData.axes.map(axis => axis.value)
          };
        })
      },
      options: {
        legend: {
          display: false
        },
        animation: {
          duration: 0
        },
        scale: {
          gridLines: {
            drawTicks: false
          },
          scaleLabel: {
            fontSize: 20
          },
          ticks: {
            max: 1,
            min: 0
          }
        }
      }
    };
    this.chart = new Chart(this.ctx, chartConfiguration);
  }

}
