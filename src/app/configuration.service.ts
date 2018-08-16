import { Injectable } from '@angular/core';
import config from './config.json';

@Injectable()
export class ConfigurationService {
  // Config fields are defined in typings.d.ts
  progressMarkerID: number;
  selectionMarkerID: number;
  searchCriteria: SearchCriterion[];
  tuioCursorEvents = true;

  constructor() {
    this.progressMarkerID = config.progressMarkerID;
    this.selectionMarkerID = config.selectionMarkerID;
    this.searchCriteria = config.searchCriteria;
    if (config.tuioCursorEvents !== undefined) {
      this.tuioCursorEvents = config.tuioCursorEvents;
    }
  }

  getSearchCriterionByKey(key: string) {
    return this.searchCriteria.find(item => item.key === key);
  }
}
