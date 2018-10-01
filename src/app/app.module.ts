import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TuioClient } from 'tuio-client';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TouchscreenComponent } from './touchscreen/touchscreen.component';
import { CanvasComponent } from './canvas/canvas.component';
import { MapComponent } from './map/map.component';
import { InfoscreenComponent } from './infoscreen/infoscreen.component';
import { RadarChartComponent } from './radar-chart/radar-chart.component';
import { ConfigurationService } from './configuration.service';
import { MapService } from './map/map.service';
import { LocalStorageService } from './local-storage/local-storage.service';

@NgModule({
  declarations: [
    AppComponent,
    InfoscreenComponent,
    RadarChartComponent,
    TouchscreenComponent,
    CanvasComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    ConfigurationService,
    LocalStorageService,
    MapService,
    {
      provide: TuioClient,
      useFactory: (config: ConfigurationService) => new TuioClient({ enableCursorEvent: config.tuioCursorEvents }),
      deps: [ConfigurationService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
