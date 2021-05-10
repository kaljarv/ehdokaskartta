import {
  Candidate
} from '../../../core';

import { 
  MapMarkerCandidate,
  MapMarkerCandidateOptions,
  MapMarkerCandidateState
} from '../map-markers';

import {
  MapDatum,
  MapDatumOptions,
  MapDatumTransition
} from './map-datum';

export interface MapDatumCandidateOptions extends MapDatumOptions {
  source: Candidate,
  transition?: MapDatumCandidateTransition,
  favourite?: boolean
}

export interface MapDatumCandidateTransition extends MapDatumTransition {
  state?: MapMarkerCandidateState
}

export class MapDatumCandidate extends MapDatum {
  public marker: MapMarkerCandidate;
  public options: MapDatumCandidateOptions;

  constructor(options: MapDatumCandidateOptions) {
    super(options);
  }

  public initMarker(contexts: CanvasRenderingContext2D[], options: MapMarkerCandidateOptions): MapMarkerCandidate {
    return this.marker = new MapMarkerCandidate(contexts, options);
  }
}
