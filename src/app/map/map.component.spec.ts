import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Map } from 'ol-cityscope';

import { ConfigurationService } from '../configuration.service';
import { AnalysisService } from '../analysis.service';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async(() => {
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
      declarations: [MapComponent],
      providers: [
        ConfigurationService,
        AnalysisService,
        { provide: Map, useFactory: () => new Map(mapConfig) }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
