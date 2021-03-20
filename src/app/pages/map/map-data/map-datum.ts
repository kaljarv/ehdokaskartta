import {
  MapAnimationDeep
} from '../map-animation';

import { 
  MapMarker, 
  MapMarkerCommonState,
  MapMarkerOptions
} from '../map-markers';

/*
 * MapDatum, MapDatumCandidate, MapDatumParty and MapDatumVoter
 *
 * A set of utility classes to hold data relevant to map markers
 */

export interface MapDatumOptions {
   // The linked object, e.g., Candidate
  source: any,
  // Proportional location [0,1] after dispersal
  x?: number, 
  y?: number,
  // Higher-numbered layers are in the front
  layer?: number,
  color?: string,
  hitColor?: string,
  // Full label when zoomed
  label?: string,
  // Used to override global label showing policy
  showLabel?: boolean,
  // Set to true to show label in front
  labelInFront?: boolean,
  // The state and other options to transition to
  transition?: MapDatumTransition
}

/*
 * These will be converted into proper animations by map-canvas
 * Override this for subclasses to reflect allowed states
 */
export interface MapDatumTransition {
  state?: MapMarkerCommonState | string,
  showLabel?: boolean
}

export const MAP_DATUM_DEFAULT_OPTIONS: MapDatumOptions = {
  source: null,
  x: 0.5,
  y: 0.5,
  layer: 10
}

export const MAP_DATUM_ANIMATION_COLLECTIONS = [
  "markerOptions", 
  "drawingOptions", 
  "datumOptions"
];

export abstract class MapDatum {
  public animations = new Set<MapAnimationDeep>();
  public marker: MapMarker;
  public options: MapDatumOptions;

  constructor(options: MapDatumOptions) {
    this.options = {...MAP_DATUM_DEFAULT_OPTIONS, ...options};
  }

  get source(): any {
    return this.options.source;
  }

  get x(): number {
    return this.options.x;
  }

  get y(): number {
    return this.options.y;
  }

  get hasAnimations(): boolean {
    return this.animations.size > 0;
  }

  /*
   * Create the marker object. Override for subclasses.
   */
  public initMarker(contexts: CanvasRenderingContext2D[], options: MapMarkerOptions): MapMarker {
    throw new Error("Not implemented!");
  }

  public addAnimation(animation: MapAnimationDeep): void {
    Object.keys(animation.propertyCollections).forEach(key => {
      if (!MAP_DATUM_ANIMATION_COLLECTIONS.includes(key))
        throw new Error(`Not an animatable colletion for MapDatum: '${key}'!`);
    });
    this.animations.add(animation);
  }

  public removeAnimationsByType(type: string): void {
    this.animations.forEach(a => {
      if (a.type === type) this.animations.delete(a);
    });
  }

  /*
   * Process all animations
   * Returns true if the datum options were changed
   */
  public applyAnimations(time: DOMHighResTimeStamp = performance.now()): boolean {

    if (this.animations.size === 0)
      return false;

    let datumChanged = false;

    // Merge all possible animation values into one object
    // With multiple animations the ones with higher priority override
    // ones with lower values

    let vals: {} = null;

    Array.from(this.animations)
      .sort((a, b) => a.priority - b.priority)
      .forEach(a => {

        if (a.completed) {
          // Clean up
          this.animations.delete(a);

        } else if (vals === null) {
          // First set of values
          vals = a.getCurrentValueCollections(time);

        } else {
          // If there are multiple animations, we must merge them per collection
          let newVals = a.getCurrentValueCollections(time);
          for (const collection in newVals) {
            vals[collection] = vals[collection] == null ? newVals[collection] : {...vals[collection], ...newVals[collection]};
          }
        }
      });

    // Apply any values in the object to
    // either the the drawing style, marker or datum
    for (const collection in vals) {

      for (const key in vals[collection]) {

        const v = vals[collection][key];

        // The special value '*' means that no changes are needed
        // Mostly used for state transitions
        if (v === "*")
          continue;

        switch (collection) {

          case "markerOptions":
            this.marker[key] = v;
            break;

          case "drawingOptions":
            this.marker.drawingOptions[0][key] = v;
            break;

          case "datumOptions":
            this.options[key] = v;
            datumChanged = true;
            break;

        }
  
      }
    }

    return datumChanged;
  }
}