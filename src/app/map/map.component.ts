import { Component, OnInit } from '@angular/core';

import { MapService } from './map.service';
import { AnalysisService } from '../analysis.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  constructor(private mapService: MapService, private analysisService: AnalysisService,
    private localStorageService: LocalStorageService) { }

  ngOnInit() {
    // force redraw of map by changing target
    this.mapService.setTarget('');
    this.mapService.setTarget('map');
    this.mapService.setView([9.99, 53.55], 11, 1, 18);

    this.registerListeners();
  }

  private registerListeners(): void {
    const sitesLayer = this.mapService.getTopicLayerByName('sites');
    const sitesSource = this.mapService.getVectorLayerSource(sitesLayer);
    if (!sitesSource) {
      return;
    }

    // When the site layer is added
    sitesLayer.olLayer.getSource().on('change', (evt: ol.events.Event) => {
      this.analysisService.setAllFeatures(evt.target.getFeatures().map(feature => this.mapService.flattenFeature(feature, sitesLayer)));
      this.analysisService.calculateMaxValues();
    });

    // When a site is selected
    sitesLayer.olSelectInteraction.on('select', (evt: ol.interaction.Select.Event) => {
      evt.selected.forEach(feature => {
        this.sendSelectFeature(feature);
      });
    });

    // When a site is locked (by doubleclick)
    this.mapService.on('dblclick', (evt: ol.MapBrowserEvent) => {
      const feature = sitesSource.getFeaturesAtCoordinate(evt.coordinate)[0];

      if (feature) {
        // Disable the default behaviour (zoom)
        evt.stopPropagation();

        this.analysisService.toggleLockFeature(this.mapService.flattenFeature(feature, sitesLayer));
        this.sendTopFeatures();
      }
    });
  }

  private sendSelectFeature(selectedFeature: ol.Feature): void {
    const flatFeature = this.mapService.featureToJSON(selectedFeature);
    const locationValues = new RadarChartData(
      selectedFeature.getId() + '-values',
      this.analysisService.normalizeLocationValues(flatFeature)
    );
    this.localStorageService.sendSelectFeature(flatFeature, locationValues);
  }

  private sendTopFeatures(): void {
    const chartData = this.analysisService.topFeatures.map(feature => new RadarChartData(
      feature.id + '-values',
      this.analysisService.normalizeLocationValues(feature)
    ));
    this.localStorageService.sendSetTopFeatures(this.analysisService.topFeatures, chartData);
  }
}
