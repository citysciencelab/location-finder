import { TestBed } from '@angular/core/testing';

import { ConfigurationService } from './configuration.service';
import { AnalysisService } from './analysis.service';

describe('AnalysisService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ConfigurationService,
      AnalysisService
    ]
  }));

  it('should be created', () => {
    const config: ConfigurationService = TestBed.get(ConfigurationService);
    const service: AnalysisService = TestBed.get(AnalysisService);
    expect(config).toBeTruthy();
    expect(service).toBeTruthy();
  });
});
