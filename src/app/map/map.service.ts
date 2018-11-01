import { Injectable } from '@angular/core';
import * as ol from 'openlayers';

import { ConfigurationService } from '../configuration.service';

@Injectable()
export class MapService {
  baseLayers: MapLayer[];
  topicLayers: MapLayer[];
  mapFeaturesById: { [key: string]: ol.Feature } = {};
  private map: ol.Map;

  constructor(private config: ConfigurationService) {
    this.map = new ol.Map({
      controls: ol.control.defaults().extend([new ol.control.ScaleLine()]),
      interactions: ol.interaction.defaults({
        altShiftDragRotate: false,
        pinchRotate: false
      })
    });

    this.addLayers(this.config.baseLayers, this.config.topicLayers);
  }

  on(type: string, listener: ol.EventsListenerFunctionType): void {
    this.map.on(type, listener);
  }

  setTarget(target: string): void {
    this.map.setTarget(target);
  }

  setView(center: ol.Coordinate, zoom: number, minZoom: number, maxZoom: number): void {
    this.map.setView(new ol.View({
      center: ol.proj.fromLonLat(center),
      zoom: zoom,
      minZoom: minZoom,
      maxZoom: maxZoom
    }));
  }

  getView(): ol.View {
    return this.map.getView();
  }

  extentContainsCoordinate(coordinate: ol.Coordinate): boolean {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    return (
      coordinate[0] > extent[0] &&
      coordinate[1] > extent[1] &&
      coordinate[0] < extent[2] &&
      coordinate[1] < extent[3]
    );
  }

  featureBufferContainsCoordinate(featureId: string | number, coordinate: ol.Coordinate): boolean {
    const feature = this.mapFeaturesById[featureId];
    const buffer = ol.extent.buffer(feature.getGeometry().getExtent(), 100);
    return ol.extent.containsCoordinate(buffer, coordinate);
  }

  applyDefaultStyle(featureId: string | number, layer: MapLayer) {
    const feature = this.mapFeaturesById[featureId];
    feature.setStyle(layer.olDefaultStyleFn);
  }

  applySelectedStyle(featureId: string | number, layer: MapLayer) {
    const feature = this.mapFeaturesById[featureId];
    feature.setStyle(layer.olSelectedStyleFn);
  }

  applyExtraStyle(featureId: string | number, layer: MapLayer) {
    const feature = this.mapFeaturesById[featureId];
    feature.setStyle(layer.olExtraStyleFn);
  }

  // Conversion from display XY to map coordinates
  getCoordinateFromXY(x: number, y: number): ol.Coordinate {
    const coordinate = this.map.getCoordinateFromPixel([x * window.innerWidth, y * window.innerHeight]);
    if (!this.extentContainsCoordinate(coordinate)) {
      return null;
    }
    return coordinate;
  }

  getFeatureCenterpoint(feature: ol.Feature): ol.Coordinate {
    return ol.extent.getCenter(feature.getGeometry().getExtent());
  }

  getSelectedFeatures(coordinate: ol.Coordinate): ol.Feature[] {
    let selectedFeatures = [];
    for (const layer of this.topicLayers) {
      const source = layer.olLayer.getSource();
      if (source.constructor === ol.source.Vector) {
        const features = (<ol.source.Vector>source).getFeaturesAtCoordinate(coordinate);
        selectedFeatures = selectedFeatures.concat(features);
      }
    }
    return selectedFeatures;
  }

  getSelectedLayer(feature: ol.Feature, coordinate: ol.Coordinate): MapLayer {
    for (const layer of this.topicLayers) {
      const source = layer.olLayer.getSource();
      if (source.constructor === ol.source.Vector) {
        const features = (<ol.source.Vector>source).getFeaturesAtCoordinate(coordinate);
        if (features.indexOf(feature) > -1) {
          return layer;
        }
      }
    }
  }

  getVectorLayerSource(layer: MapLayer): ol.source.Vector {
    const source = <ol.source.Vector>layer.olLayer.getSource();
    if (source.constructor !== ol.source.Vector) {
      return;
    }
    return source;
  }

  getBaseLayerByName(name: string): MapLayer {
    return this.baseLayers.find(layer => layer.name === name);
  }

  getTopicLayerByName(name: string): MapLayer {
    return this.topicLayers.find(layer => layer.name === name);
  }

  /*
   * Zoom out, fly to the feature, zoom in
   */
  zoomTo(coordinate: ol.Coordinate, zoom1: number, zoom2: number): void {
    this.map.getView().animate(
      { zoom: zoom1 },
      { center: coordinate },
      { zoom: zoom2 }
    );
  }

  dispatchSelectEvent(layer: MapLayer, selected: ol.Feature[], coordinate: ol.Coordinate): void {
    const source = <ol.source.Vector>layer.olLayer.getSource();
    if (source.constructor !== ol.source.Vector) {
      return;
    }
    const deselected = source.getFeatures().filter(feature => selected.indexOf(feature) === -1);

    const selectEvent = <ol.interaction.Select.Event>{
      type: 'select',
      selected: selected,
      deselected: deselected,
      mapBrowserEvent: {
        coordinate: coordinate
      }
    };
    layer.olSelectInteraction.dispatchEvent(selectEvent);
  }

  private addLayers(baseLayersConfig: MapLayer[], topicLayersConfig: MapLayer[]): void {
    this.baseLayers = this.generateLayers(baseLayersConfig);
    this.topicLayers = this.generateLayers(topicLayersConfig);

    this.generateStyles(this.baseLayers);
    this.generateStyles(this.topicLayers);

    for (const layer of this.baseLayers.concat(this.topicLayers)) {
      this.map.addLayer(layer.olLayer);

      // Set the default/selected styles for each vector layer
      if (layer.olLayer.constructor === ol.layer.Vector) {
        (<ol.layer.Vector>layer.olLayer).setStyle(layer.olDefaultStyleFn);

        if (layer.selectable) {
          this.addSelectedStyleOnLayer(layer);
        }
      }
    }
  }

  private addSelectedStyleOnLayer(layer: MapLayer): void {
    layer.olSelectInteraction = new ol.interaction.Select({
      // Make this interaction work only for the layer provided
      layers: [layer.olLayer],
      style: (feature: ol.Feature, resolution: number) => {
        return layer.olSelectedStyleFn(feature, resolution);
      },
      hitTolerance: 8
    });

    this.map.addInteraction(layer.olSelectInteraction);
  }

  private generateLayers(layersConfig: MapLayer[]): MapLayer[] {
    return layersConfig.map(layer => {
      // Create the OpenLayers layer
      const source = layer.source;
      switch (layer.type) {
        case 'OSM':
          layer.olLayer = new ol.layer.Tile({
            source: new ol.source.OSM({
              url: source.url ? source.url : undefined
            }),
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            visible: layer.visible
          });
          break;
        case 'Tile':
          layer.olLayer = new ol.layer.Tile({
            source: new ol.source.TileImage({
              url: source.url,
              projection: source.projection
            }),
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            visible: layer.visible
          });
          break;
        case 'WMS':
          if (!source.wmsParams) {
            throw new Error('No WMS params defined for layer ' + layer.name);
          }
          if (source.wmsParams.TILED) {
            layer.olLayer = new ol.layer.Tile({
              source: new ol.source.TileWMS({
                url: source.url,
                params: source.wmsParams
              }),
              opacity: layer.opacity,
              zIndex: layer.zIndex,
              visible: layer.visible
            });
          } else {
            layer.olLayer = new ol.layer.Image({
              source: new ol.source.ImageWMS({
                url: source.url,
                params: source.wmsParams,
                projection: source.wmsProjection
              }),
              opacity: layer.opacity,
              zIndex: layer.zIndex,
              visible: layer.visible
            });
          }
          break;
        case 'Vector':
          if (!source.format || typeof ol.format[source.format] !== 'function') {
            throw new Error('No vector format provided for layer ' + layer.name);
          }
          layer.olLayer = new ol.layer.Vector({
            renderMode: 'image', // for performance
            source: new ol.source.Vector({
              url: source.url,
              format: new ol.format[source.format]()
            }),
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            visible: layer.visible
          });
          break;
        case 'Heatmap':
          layer.olLayer = new ol.layer.Heatmap({
            source: new ol.source.Vector({
              url: source.url,
              format: new ol.format[source.format]()
            }),
            weight: layer.weightAttribute ? feature => feature.get(layer.weightAttribute) / layer.weightAttributeMax : () => 1,
            gradient: layer.gradient && layer.gradient.length > 1 ? layer.gradient : ['#0ff', '#0f0', '#ff0', '#f00'],
            radius: layer.radius !== undefined ? layer.radius : 16,
            blur: layer.blur !== undefined ? layer.blur : 30,
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            visible: layer.visible
          });
          break;
      }
      return layer;
    }) || [];
  }

  private generateStyles(layers: MapLayer[]) {
    for (const layer of layers) {
      if (layer.style) {
        layer.olDefaultStyleFn = this.styleConfigToStyleFunction(layer.style, layer.scale, layer.scaleAttribute);
      }
      if (layer.selectedStyle) {
        layer.olSelectedStyleFn = this.styleConfigToStyleFunction(layer.selectedStyle, layer.scale, layer.scaleAttribute);
      }
      if (layer.extraStyle) {
        layer.olExtraStyleFn = this.styleConfigToStyleFunction(layer.extraStyle, layer.scale, layer.scaleAttribute);
      }
    }
  }

  private styleConfigToStyleFunction(style: LayerStyle, scale: { [key: string]: ol.Color }, scaleAttribute: string): ol.StyleFunction {
    // Function to build a Fill object
    const getFill = (feature: ol.Feature) => {
      if (style.fill.color) {
        return new ol.style.Fill(style.fill);
      }
      if (style.fill.categorizedScale) {
        return new ol.style.Fill({
          color: this.getColorFromCategorizedScale(feature, scaleAttribute, scale)
        });
      }
      if (style.fill.graduatedScale) {
        return new ol.style.Fill({
          color: this.getColorFromGraduatedScale(feature, scaleAttribute, scale)
        });
      }
    };

    // Function to build a Stroke object
    const getStroke = (feature: ol.Feature) => {
      if (style.stroke.color) {
        return new ol.style.Stroke(style.stroke);
      }
      if (style.stroke.categorizedScale) {
        return new ol.style.Stroke({
          color: this.getColorFromCategorizedScale(feature, scaleAttribute, scale),
          width: style.stroke.width
        });
      }
      if (style.stroke.graduatedScale) {
        return new ol.style.Stroke({
          color: this.getColorFromGraduatedScale(feature, scaleAttribute, scale),
          width: style.stroke.width
        });
      }
    };

    const minResolution = style.text && style.text.minResolution ? style.text.minResolution : 0;
    const maxResolution = style.text && style.text.maxResolution ? style.text.maxResolution : Infinity;

    // Here the actual style function is returned
    return (feature: ol.Feature, resolution: number) => new ol.style.Style({
      fill: style.fill ? getFill(feature) : null,
      stroke: style.stroke ? getStroke(feature) : null,
      image: style.circle ? new ol.style.Circle({
        radius: style.circle.radius,
        fill: new ol.style.Fill(style.circle.fill),
        stroke: new ol.style.Stroke(style.circle.stroke)
      }) : style.icon ? new ol.style.Icon({
        src: style.icon.src,
        anchor: style.icon.anchor
      }) : null,
      text: style.text && resolution <= maxResolution && resolution >= minResolution ? new ol.style.Text({
        text: this.formatText(feature.get(style.text.attribute), style.text.round),
        font: style.text.font,
        fill: new ol.style.Fill(style.text.fill),
        stroke: new ol.style.Stroke(style.text.stroke),
        offsetX: style.text.offsetX,
        offsetY: style.text.offsetY
      }) : null
    });
  }

  private formatText(value: any, round: boolean): string {
    if (value === null) {
      return '';
    }
    if (typeof value === 'number') {
      value = round ? Math.round(value) : value;
    }
    return '' + value;
  }

  private getColorFromCategorizedScale(feature: ol.Feature, attribute: string, scale: { [key: string]: ol.Color }): ol.Color {
    if (!scale) {
      throw new Error('Cannot apply style: scale is not defined');
    }
    if (!attribute) {
      throw new Error('Cannot apply style: scale attribute is not defined');
    }
    return scale[feature.get(attribute)];
  }

  private getColorFromGraduatedScale(feature: ol.Feature, attribute: string, scale: { [key: string]: ol.Color }): ol.Color {
    if (!scale) {
      throw new Error('Cannot apply style: scale is not defined');
    }
    if (!attribute) {
      throw new Error('Cannot apply style: scale attribute is not defined');
    }
    let value = feature.get(attribute);
    if (value === null) {
      value = 0;
    }
    if (typeof value !== 'number') {
      throw new Error('Cannot apply style: value is not a number');
    }
    return Object.entries(scale).reduce((previous, current) => {
      const limit = parseInt(current[0], 10);
      if (value < limit) {
        return previous;
      }
      return current[1];
    }, <ol.Color>[0, 0, 0, 1]);
  }
}
