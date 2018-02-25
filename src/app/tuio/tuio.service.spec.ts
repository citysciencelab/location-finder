import { TestBed, inject } from '@angular/core/testing';

import { TuioService } from './tuio.service';

describe('TuioService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TuioService]
    });
  });

  it('should be created', inject([TuioService], (service: TuioService) => {
    expect(service).toBeTruthy();
  }));
});
