export interface Feature {
  type: string;
  id: string;
  layer: MapLayer;
  properties: { [k: string]: any };
  olFeature: ol.Feature;
}
