import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TouchscreenComponent } from './touchscreen.component';
import { CanvasComponent } from './canvas/canvas.component';
import { MapComponent } from './map/map.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    TouchscreenComponent,
    CanvasComponent,
    MapComponent
  ]
})
export class TouchscreenModule { }
