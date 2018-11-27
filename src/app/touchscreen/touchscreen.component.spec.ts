import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TuioClient } from 'tuio-client';
import { Map } from 'ol-cityscope';

import { ConfigurationService } from '../configuration.service';
import { AnalysisService } from '../analysis.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { CanvasComponent } from '../canvas/canvas.component';
import { MapComponent } from '../map/map.component';
import { TouchscreenComponent } from './touchscreen.component';

describe('TouchscreenComponent', () => {
  let component: TouchscreenComponent;
  let fixture: ComponentFixture<TouchscreenComponent>;

  beforeEach(async(() => {
    const tuioClientConfig = {
      enableCursorEvent: false
    };
    const mapConfig = {
      baseLayers: [],
      topicLayers: [
        {
          name: 'sites',
          displayName: 'Sites',
          type: <'Vector'>'Vector',
          source: {
            url: 'FIXME',
            format: 'GeoJSON'
          },
          visible: true,
          selectable: true
        }
      ]
    };
    TestBed.configureTestingModule({
      declarations: [CanvasComponent, MapComponent, TouchscreenComponent],
      providers: [
        ConfigurationService,
        AnalysisService,
        LocalStorageService,
        { provide: TuioClient, useFactory: () => new TuioClient(tuioClientConfig) },
        { provide: Map, useFactory: () => new Map(mapConfig) },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TouchscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
