import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TouchscreenModule } from './touchscreen/touchscreen.module';
import { InfoscreenModule } from './infoscreen/infoscreen.module';
import { ConfigurationService } from './configuration.service';
import { MapService } from './map.service';
import { LocalStorageService } from './local-storage.service';
import { TuioService } from './tuio/tuio.service';

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
    ConfigurationService,
    LocalStorageService,
    MapService,
    TuioService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
