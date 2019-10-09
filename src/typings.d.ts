import { MapLayer } from "ol-cityscope";

/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

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
