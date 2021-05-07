import { 
  MapMarkerCandidate,
  MapMarkerCandidateOptions,
  MapMarkerCommonState
} from '../map-markers';

import { 
  MapDatum,
  MapDatumOptions,
  MapDatumTransition 
} from './map-datum';

export interface MapDatumVoterOptions extends MapDatumOptions {
  source: any,
  transition?: MapDatumVoterTransition,
}

export interface MapDatumVoterTransition extends MapDatumTransition {
  state?: MapMarkerCommonState
}

export class MapDatumVoter extends MapDatum {
  public marker: MapMarkerCandidate;
  public options: MapDatumVoterOptions;

  constructor(options: MapDatumVoterOptions) {
    super(options);
  }

  public initMarker(contexts: CanvasRenderingContext2D[], options: MapMarkerCandidateOptions): MapMarkerCandidate {
    return this.marker = new MapMarkerCandidate(contexts, options);
  }
}