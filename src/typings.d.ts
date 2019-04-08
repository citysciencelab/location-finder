/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

// Workaround for typings that don't get properly imported from ol-cityscope
declare interface Source {
  url?: string;
  projection?: string;
  wmsParams?: { [key: string]: string | number | boolean };
  wmsProjection?: string;
  format?: string;
}

declare interface Fill {
  color?: string;
  categorizedScale?: boolean;
  graduatedScale?: boolean;
}

declare interface Stroke {
  color?: string;
  width?: number;
  categorizedScale?: boolean;
  graduatedScale?: boolean;
}

declare interface LayerStyle {
  fill?: Fill;
  stroke?: Stroke;
  circle?: {
    radius: number;
    fill: Fill;
    stroke: Stroke;
  };
  icon?: {
    anchor?: [number, number];
    src: string;
  };
  text?: {
    maxResolution?: number;
    minResolution?: number;
    attribute: string;
    round: boolean;
    font: string;
    fill: Fill;
    stroke: Stroke;
    offsetX?: number;
    offsetY?: number;
  };
}

declare interface MapLayer {
  name: string;
  displayName: string;
  type: 'WMS' | 'OSM' | 'Tile' | 'Vector' | 'Heatmap';
  source: Source;
  sources?: { [stage: string]: Source };
  category?: string;
  // Heatmap
  weightAttribute?: string;
  weightAttributeMax?: number;
  gradient?: string[];
  radius?: number;
  blur?: number;
  // all types
  opacity?: number;
  zIndex?: number;
  visible: boolean;
  selectable?: boolean;
  legendHtml?: string;
  legendUrl?: string;
  meta?: string;
  style?: LayerStyle;
  selectedStyle?: LayerStyle;
  extraStyle?: LayerStyle;
  scale?: { [key: string]: ol.Color };
  scaleAttribute?: string;
  // No config - assigned at runtime
  olLayers: {
    [stage: string]: {
      layer: ol.layer.Layer,
      defaultStyleFn: ol.StyleFunction,
      selectedStyleFn: ol.StyleFunction,
      extraStyleFn: ol.StyleFunction,
      selectInteraction: ol.interaction.Select
    }
  };
}
// End of Workaround

declare interface SearchCriterion {
  key: string;
  'name_en-US': string;
  'name_de-DE': string;
  markerID: number;
  color: string;
}

declare interface Config {
  baseLayers: MapLayer[];
  topicLayers: MapLayer[];
  progressMarkerID: number;
  selectionMarkerID: number;
  searchCriteria: SearchCriterion[];
  enableTuio: boolean;
  tuioCursorEvents?: boolean;
}

declare module '*.json' {
  const value: Config;
  export default value;
}
