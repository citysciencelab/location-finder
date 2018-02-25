import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoscreenComponent } from './infoscreen.component';
import { RadarChartComponent } from './radar-chart/radar-chart.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    InfoscreenComponent,
    RadarChartComponent
  ]
})
export class InfoscreenModule { }
