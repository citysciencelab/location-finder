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
  progressMarkerID: number;
  selectionMarkerID: number;
  searchCriteria: SearchCriterion[];
}

declare module '*.json' {
  const value: Config;
  export default value;
}
