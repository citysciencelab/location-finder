import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TuioClient } from 'tuio-client';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TouchscreenModule } from './touchscreen/touchscreen.module';
import { InfoscreenModule } from './infoscreen/infoscreen.module';
import { ConfigurationService } from './configuration.service';
import { MapService } from './map.service';
import { LocalStorageService } from './local-storage.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TouchscreenModule,
    InfoscreenModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    ConfigurationService,
    LocalStorageService,
    MapService,
    TuioClient
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
