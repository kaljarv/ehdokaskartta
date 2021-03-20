import {
  Party
} from '../../../core';

import { 
  MapMarkerParty,
  MapMarkerPartyOptions,
  MapMarkerCommonState
} from '../map-markers';

import {
  MapDatum,
  MapDatumOptions,
  MapDatumTransition
} from './map-datum';

export interface MapDatumPartyOptions extends MapDatumOptions {
  source: Party,
  transition?: MapDatumPartyTransition,
  // The text on the flag
  text: string
}

export interface MapDatumPartyTransition extends MapDatumTransition {
  state?: MapMarkerCommonState
}

export class MapDatumParty extends MapDatum {
  public marker: MapMarkerParty;
  public options: MapDatumPartyOptions;

  constructor(options: MapDatumPartyOptions) {
    super(options);
  }

  public initMarker(contexts: CanvasRenderingContext2D[], options: MapMarkerPartyOptions): MapMarkerParty {
    return this.marker = new MapMarkerParty(contexts, options);
  }
}