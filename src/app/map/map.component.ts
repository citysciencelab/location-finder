import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { SelectEvent } from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { CsMap } from 'ol-cityscope';

import { AnalysisService } from '../analysis.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  @Output() private selectFeature = new EventEmitter<Feature>();
  @Output() private deselectFeatures = new EventEmitter<Feature[]>();
  @Output() private toggleLockFeature = new EventEmitter<Feature>();

  constructor(private map: CsMap, private analysisService: AnalysisService) { }

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
    const sitesOlLayer = sitesLayer.olLayers['*'];
    const sitesSource = <VectorSource>sitesOlLayer.layer.getSource();

    // When the site layer is added, keep track of the map features. We'll need them later
    sitesOlLayer.layer.getSource().on('change', (evt: Event) => {
      const features = (<VectorSource>evt.target).getFeatures();
      for (const feature of features) {
        this.map.mapFeaturesById[feature.getId()] = feature;
      }
      this.analysisService.setAllPlots(features);
      this.analysisService.calculateMaxValues();
    });

    // Emit select/deselect events when a site is selected
    this.map.selectInteraction.on('select', (evt: SelectEvent) => {
      evt.selected.forEach(feature => {
        this.selectFeature.emit(feature);
      });
      this.deselectFeatures.emit(evt.deselected);
    });

    // Emit an event when a site is doubleclicked
    this.map.on('dblclick', (evt: MapBrowserEvent) => {
      const feature = sitesSource.getFeaturesAtCoordinate(evt.coordinate)[0];

      if (feature) {
        // Prevent the default behaviour (zoom)
        evt.preventDefault();
        this.toggleLockFeature.emit(feature);
        return true;
      }
      return false;
    });
  }
}
