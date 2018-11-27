import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadarChartComponent } from '../radar-chart/radar-chart.component';
import { InfoscreenComponent } from './infoscreen.component';

describe('InfoscreenComponent', () => {
  let component: InfoscreenComponent;
  let fixture: ComponentFixture<InfoscreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InfoscreenComponent, RadarChartComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
