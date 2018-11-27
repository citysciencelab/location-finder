import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as olcs from 'ol-cityscope';

import { AnalysisService } from '../analysis.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  @Output() private selectFeature = new EventEmitter<ol.Feature>();
  @Output() private deselectFeatures = new EventEmitter<ol.Feature[]>();
  @Output() private toggleLockFeature = new EventEmitter<ol.Feature>();

  constructor(private map: olcs.Map, private analysisService: AnalysisService) { }

  ngOnInit() {
    this.map.setTarget('map');
    this.map.setView([9.99, 53.55], 11, 1, 18);
    this.registerListeners();
  }

  private registerListeners(): void {
    const sitesLayer = this.map.getTopicLayerByName('sites');
    if (!sitesLayer) {
      throw new Error('Site layer is missing');
    }
    const sitesSource = olcs.getVectorLayerSource(sitesLayer);
    if (!sitesSource) {
      return;
    }

    // When the site layer is added, keep track of the map features. We'll need them later
    sitesLayer.olLayer.getSource().on('change', (evt: ol.events.Event) => {
      const features = (<ol.source.Vector>evt.target).getFeatures();
      for (const feature of features) {
        this.map.mapFeaturesById[feature.getId()] = feature;
      }
      this.analysisService.setAllPlots(features);
      this.analysisService.calculateMaxValues();
    });

    // Emit select/deselect events when a site is selected
    sitesLayer.olSelectInteraction.on('select', (evt: ol.interaction.Select.Event) => {
      evt.selected.forEach(feature => {
        this.selectFeature.emit(feature);
      });
      this.deselectFeatures.emit(evt.deselected);
    });

    // Emit an event when a site is doubleclicked
    this.map.on('dblclick', (evt: ol.MapBrowserEvent) => {
      const feature = sitesSource.getFeaturesAtCoordinate(evt.coordinate)[0];

      if (feature) {
        // Prevent the default behaviour (zoom)
        evt.preventDefault();
        this.toggleLockFeature.emit(feature);
      }
    });
  }
}
