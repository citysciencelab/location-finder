import { Injectable } from '@angular/core';
import * as ol from 'openlayers';
import { environment } from '../environments/environment';
import { ConfigurationService } from './configuration.service';
import { LocalStorageService } from './local-storage.service';
import { Feature } from './feature.model';
import { RadarChartData } from './infoscreen/radar-chart/radar-chart-data.model';

@Injectable()
export class MapService {
  private instance: ol.Map;
  private geoJSON: ol.format.GeoJSON = new ol.format.GeoJSON();
  private dop20Source: ol.source.Tile;
  private extra2000Source: ol.source.Tile;
  private extra10000Source: ol.source.Tile;
  private extra25000Source: ol.source.Tile;
  private extra50000Source: ol.source.Tile;
  private siteSource: ol.source.Vector;
  private siteMarkerSource: ol.source.Vector;
  private siteHighlightSource: ol.source.Vector;
  private siteLockedSource: ol.source.Vector;
  allFeatures: ol.Feature[] = [];
  topFeatures: ol.Feature[] = [];
  maxValues: {[key: string]: number} = {};
  lastSelectedFeature: ol.Feature;

  constructor(private config: ConfigurationService, private localStorageService: LocalStorageService) {
    this.setSources();
    this.instance = new ol.Map({
      controls: ol.control.defaults().extend([new ol.control.ScaleLine()]),
      layers: this.getLayers(),
      view: new ol.View({
        center: ol.proj.fromLonLat([9.99, 53.55]),
        zoom: 11,
        maxZoom: 18
      })
    });
    this.registerSiteSourceAddFeatureListener();
    this.registerSiteHighlightSourceAddFeatureListener();
    this.registerSiteLockedAddFeatureListener();
    this.registerSiteLockedRemoveFeatureListener();
    if (!environment.production) {
      this.registerSingleClickListener();
      this.registerDoubleClickListener();
    }
  }

  setTarget(target: string) {
    this.instance.setTarget(target);
  }

  extentContainsCoordinate(coordinate: [number, number]) {
    const extent = this.instance
      .getView()
      .calculateExtent(this.instance.getSize());
    return (
      coordinate[0] > extent[0] &&
      coordinate[1] > extent[1] &&
      coordinate[0] < extent[2] &&
      coordinate[1] < extent[3]
    );
  }

  featureBufferContainsCoordinate(feature: ol.Feature, coordinate: [number, number]) {
    const buffer = ol.extent.buffer(feature.getGeometry().getExtent(), 100);
    return ol.extent.containsCoordinate(buffer, coordinate);
  }

  getFeatureAtCoordinate(coordinate: [number, number]) {
    return this.siteSource.getFeaturesAtCoordinate(coordinate)[0];
  }

  highlightFeature(feature: ol.Feature) {
    this.siteHighlightSource.addFeature(feature);
  }

  lockFeature(feature: ol.Feature) {
    this.siteLockedSource.addFeature(feature);
  }

  unlockFeature(feature: ol.Feature) {
    this.siteLockedSource.removeFeature(feature);
  }

  featureToJSON(feature: ol.Feature) {
    return <Feature>JSON.parse(this.geoJSON.writeFeature(feature));
  }

  onSelectMapFeature(coordinate: [number, number]) {
    const selectedFeature = this.getFeatureAtCoordinate(coordinate);

    if (!selectedFeature) {
      return null;
    }
    if (
      !this.lastSelectedFeature ||
      this.lastSelectedFeature.getId() !== selectedFeature.getId()
    ) {
      this.highlightFeature(selectedFeature);
      this.sendSelectFeature(selectedFeature);
      this.lastSelectedFeature = selectedFeature;
    }
    return selectedFeature;
  }

  normalizeLocationValues(feature: ol.Feature) {
    if (!this.maxValues || this.maxValues.length === 0) {
      throw new Error('max values are not defined');
    }
    const properties = feature.getProperties();

    return this.config.searchCriteria.map(item => ({
      name: item.key,
      value: properties[item.key] / this.maxValues[item.key]
    }));
  }

  // Conversion from display XY to map coordinates
  getCoordinateFromXY(x: number, y: number) {
    const coordinate = this.instance.getCoordinateFromPixel([this.getWindowX(x), this.getWindowY(y)]);
    if (!this.extentContainsCoordinate(coordinate)) {
      return null;
    }
    return coordinate;
  }

  /*
   * Returns pixel coordinate from a given X value in range [0, 1]
   */
  getWindowX(x: number) {
    return x * window.innerWidth;
  }

  /*
   * Returns pixel coordinate from a given Y value in range [0, 1]
   */
  getWindowY(y: number) {
    return y * window.innerHeight;
  }

  findTopFeatureById(id: string | number) {
    return this.topFeatures.find(item => item.getId() === id);
  }

  private registerSingleClickListener() {
    this.instance.on('singleclick', (e: ol.MapBrowserEvent) => {
      this.onSelectMapFeature(e.coordinate);
    });
  }

  private registerDoubleClickListener() {
    this.instance.on('dblclick', (e: ol.MapBrowserEvent) => {
      const selectedFeature = this.getFeatureAtCoordinate(e.coordinate);
      if (selectedFeature) {
        const alreadyLocked = this.topFeatures.find(item => {
          return item.getId() === selectedFeature.getId();
        });
        if (alreadyLocked) {
          this.topFeatures.splice(this.topFeatures.indexOf(selectedFeature), 1);
          this.unlockFeature(selectedFeature);
          this.sendSelectFeature(selectedFeature);
          this.lastSelectedFeature = selectedFeature;
        } else {
          this.topFeatures.push(selectedFeature);
          this.lockFeature(selectedFeature);
          this.sendSelectFeature(selectedFeature);
          this.lastSelectedFeature = selectedFeature;
        }
        this.sendTopFeatures();
      }
    });
  }

  private sendSelectFeature(selectedFeature: ol.Feature) {
    const locationValues = new RadarChartData(
      selectedFeature.getId() + '-values',
      this.normalizeLocationValues(selectedFeature)
    );
    this.localStorageService.sendSelectFeature(this.featureToJSON(selectedFeature), locationValues);
  }

  private sendTopFeatures() {
    const topFeaturesAsJSON = this.topFeatures.map(feature => this.featureToJSON(feature));
    const chartData = this.topFeatures.map(feature => new RadarChartData(
      feature.getId() + '-values',
      this.normalizeLocationValues(feature)
    ));
    this.localStorageService.sendSetTopFeatures(topFeaturesAsJSON, chartData);
  }

  private registerSiteSourceAddFeatureListener() {
    this.siteSource.on('addfeature', (e: ol.source.VectorEvent) => {
      const getFeatures = this.siteSource.getFeatures();
      const properties = e.feature.getProperties();

      if (getFeatures.length > this.allFeatures.length) {
        // Store features from site layer
        this.allFeatures.push(e.feature);

        // Store max values
        this.config.searchCriteria.forEach(item => {
          this.maxValues[item.key] = Math.max(
            this.maxValues[item.key] || 0,
            parseInt(properties[item.key], 10) || 0
          );
        });
      }
    });
  }

  private registerSiteHighlightSourceAddFeatureListener() {
    this.siteHighlightSource.on('addfeature', (e: ol.source.VectorEvent) => {
      // Remove the underlying feature and re-add all others to siteSource
      const featureById = this.siteSource.getFeatureById(e.feature.getId());
      if (featureById) {
        this.siteSource.removeFeature(featureById);
      }
      this.siteSource.addFeatures(
        this.allFeatures.filter(function(feature) {
          return feature.getId() !== e.feature.getId();
        })
      );
      // Remove all others from siteHighlightSource
      this.siteHighlightSource
        .getFeatures()
        .filter(function(feature) {
          return feature.getId() !== e.feature.getId();
        })
        .forEach(feature => {
          this.siteHighlightSource.removeFeature(feature);
        });
    });
  }

  private registerSiteLockedAddFeatureListener() {
    this.siteLockedSource.on('addfeature', (e: ol.source.VectorEvent) => {
      const featureById = this.siteHighlightSource.getFeatureById(e.feature.getId());
      if (featureById) {
        this.siteHighlightSource.removeFeature(featureById);
      }
    });
  }

  private registerSiteLockedRemoveFeatureListener() {
    this.siteLockedSource.on('removefeature', (e: ol.source.VectorEvent) => {
      this.siteHighlightSource.addFeature(e.feature);
    });
  }

  private setSources() {
    this.dop20Source = new ol.source.TileWMS({
      url: environment.geoserverUrl + 'locationfinder/wms',
      params: {
        LAYERS: 'locationfinder:dop20',
        TILED: true,
        FORMAT: 'image/jpeg',
        WIDTH: 256,
        HEIGHT: 256,
        SRS: 'EPSG:4326'
      }
    });

    this.extra2000Source = new ol.source.TileWMS({
      url: environment.geoserverUrl + 'locationfinder/wms',
      params: {
        LAYERS: 'locationfinder:lf_2000',
        TILED: true,
        FORMAT: 'image/png',
        WIDTH: 256,
        HEIGHT: 256,
        SRS: 'EPSG:4326'
      }
    });

    this.extra10000Source = new ol.source.TileWMS({
      url: environment.geoserverUrl + 'locationfinder/wms',
      params: {
        LAYERS: 'locationfinder:lf_10000',
        TILED: true,
        FORMAT: 'image/png',
        WIDTH: 256,
        HEIGHT: 256,
        SRS: 'EPSG:4326'
      }
    });

    this.extra25000Source = new ol.source.TileWMS({
      url: environment.geoserverUrl + 'locationfinder/wms',
      params: {
        LAYERS: 'locationfinder:lf_25000',
        TILED: true,
        FORMAT: 'image/png',
        WIDTH: 256,
        HEIGHT: 256,
        SRS: 'EPSG:4326'
      }
    });

    this.extra50000Source = new ol.source.TileWMS({
      url: environment.geoserverUrl + 'locationfinder/wms',
      params: {
        LAYERS: 'locationfinder:lf_50000',
        TILED: true,
        FORMAT: 'image/png',
        WIDTH: 256,
        HEIGHT: 256,
        SRS: 'EPSG:4326'
      }
    });

    this.siteSource = new ol.source.Vector({
      format: this.geoJSON,
      url: environment.geoserverUrl +
        'locationfinder/wfs' +
        '?service=WFS' +
        '&version=1.1.0' +
        '&request=GetFeature' +
        '&typename=locationfinder:grundstuecke' +
        '&outputFormat=application/json' +
        '&srsname=EPSG:3857'
    });

    this.siteMarkerSource = new ol.source.Vector({
      format: this.geoJSON,
      url: environment.geoserverUrl +
        'locationfinder/wfs' +
        '?service=WFS' +
        '&version=1.1.0' +
        '&request=GetFeature' +
        '&typename=locationfinder:grundstuecke_centerpoints' +
        '&outputFormat=application/json' +
        '&srsname=EPSG:3857'
    });

    this.siteHighlightSource = new ol.source.Vector();

    this.siteLockedSource = new ol.source.Vector();
  }

  private getLayers() {
    const dop20Layer = new ol.layer.Tile({
      source: this.dop20Source
    });

    const extra2000Layer = new ol.layer.Tile({
      source: this.extra2000Source,
      maxResolution: 2.6
    });

    const extra10000Layer = new ol.layer.Tile({
      source: this.extra10000Source,
      minResolution: 2.6,
      maxResolution: 13.5
    });

    const extra25000Layer = new ol.layer.Tile({
      source: this.extra25000Source,
      minResolution: 13.5,
      maxResolution: 33
    });

    const extra50000Layer = new ol.layer.Tile({
      source: this.extra50000Source,
      minResolution: 33
    });

    const siteLayer = new ol.layer.Vector({
      source: this.siteSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 0, 1)',
          width: 4
        })
      })
    });

    const siteMarkerLayer = new ol.layer.Vector({
      source: this.siteMarkerSource,
      style: new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: './assets/Map_marker.svg'
        })
      })
    });

    const siteHighlightLayer = new ol.layer.Vector({
      source: this.siteHighlightSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 165, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 165, 0, 1)',
          width: 4
        })
      })
    });

    const siteLockedLayer = new ol.layer.Vector({
      source: this.siteLockedSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(0, 255, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 255, 0, 1)',
          width: 4
        })
      })
    });

    return [
      dop20Layer,
      extra2000Layer,
      extra10000Layer,
      extra25000Layer,
      extra50000Layer,
      siteLayer,
      siteHighlightLayer,
      siteLockedLayer,
      siteMarkerLayer
    ];
  }
}
