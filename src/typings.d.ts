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
  weightAttribute?: string;
  weightAttributeMax?: number;
  gradient?: string[];
  radius?: number;
  blur?: number;
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
  olLayer?: ol.layer.Layer;
  olDefaultStyleFn?: ol.StyleFunction;
  olSelectedStyleFn?: ol.StyleFunction;
  olExtraStyleFn?: ol.StyleFunction;
  olSelectInteraction?: ol.interaction.Select;
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
