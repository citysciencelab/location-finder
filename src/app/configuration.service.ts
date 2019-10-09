import { Injectable } from '@angular/core';
import { MapLayer } from 'ol-cityscope';

import { SearchCriterion } from '../typings.js';
import config from './config.json';

@Injectable()
export class ConfigurationService {
  // Config fields are defined in typings.d.ts
  baseLayers: MapLayer[];
  topicLayers: MapLayer[];
  progressMarkerID: number;
  selectionMarkerID: number;
  searchCriteria: SearchCriterion[];
  enableTuio: boolean;
  tuioCursorEvents: boolean;

  constructor() {
    this.baseLayers = config.baseLayers;
    this.topicLayers = config.topicLayers;
    this.progressMarkerID = config.progressMarkerID;
    this.selectionMarkerID = config.selectionMarkerID;
    this.searchCriteria = config.searchCriteria;
    this.enableTuio = config.enableTuio;
    if (config.tuioCursorEvents !== undefined) {
      this.tuioCursorEvents = config.tuioCursorEvents;
    }
  }

  getSearchCriterionByKey(key: string) {
    return this.searchCriteria.find(item => item.key === key);
  }
}
