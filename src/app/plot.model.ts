import * as olcs from 'ol-cityscope';

export class Plot {
  id: string | number;
  properties: { [k: string]: any };
  centerpoint: [number, number];

  constructor(feature?: ol.Feature) {
    if (feature) {
      this.id = feature.getId();
      this.properties = {};
      for (const [key, value] of Object.entries(feature.getProperties())) {
        // We cannot serialize the geometry, so we skip it
        if (key === 'geometry') {
          continue;
        }
        this.properties[key] = value;
      }
      this.centerpoint = olcs.getFeatureCenterpoint(feature);
    }
  }
}
