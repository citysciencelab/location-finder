export interface Feature {
  type: string;
  id: string;
  geometry: ol.render.Feature;
  properties: { [k: string]: any };
}
