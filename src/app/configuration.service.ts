import { Injectable } from '@angular/core';
import config from './config.json';

@Injectable()
export class ConfigurationService {
  // Config fields are defined in typings.d.ts
  progressMarkerID: number;
  selectionMarkerID: number;
  searchCriteria: SearchCriterion[];

  constructor() {
    this.progressMarkerID = config.progressMarkerID;
    this.selectionMarkerID = config.selectionMarkerID;
    this.searchCriteria = config.searchCriteria;
  }

  getSearchCriterionByKey(key: string) {
    return this.searchCriteria.find(item => item.key === key);
  }
}
