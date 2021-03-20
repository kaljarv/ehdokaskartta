import {
  MapAnimation,
  MapAnimationOptions,
  MapAnimationProperties,
  MapAnimationValue
} from './map-animation';

export type MapAnimationPropertiesDeep = {
  [collection: string]: MapAnimationProperties
}

/*
 * Allows collections of animated properties instead of a flat dict, e.g.,
 *
 * const a = MapAnimationDeep(
 *    { markerOptions: {
 *        state: { from: "minimized", to: "active" }
 *      },
 *      drawingOptions: {
 *        opacity: { from: 0, to: 1 }
 *      }
 *    }
 * );
 */
export class MapAnimationDeep extends MapAnimation {
  protected _propertyCollections: MapAnimationPropertiesDeep;

  constructor(
    propertyCollections: MapAnimationPropertiesDeep,
    options: MapAnimationOptions = {}
  ) {
    super(null, options);
    this.propertyCollections = propertyCollections;
  }

  /*
   * We override these, as we are not using properties at all
   */
  public get properties(): MapAnimationProperties {
    throw new Error("Use propertyCollections instead of properties with MapAnimationDeep!");
  }

  public set properties(v: MapAnimationProperties) {
    if (v != null)
      throw new Error("Use propertyCollections instead of properties with MapAnimationDeep!");
  }

  public get propertyCollections(): MapAnimationPropertiesDeep {
    return this._propertyCollections;
  }

  public set propertyCollections(v: MapAnimationPropertiesDeep) {
    this._propertyCollections = v;
  }

  public getCurrentValueCollections(time: DOMHighResTimeStamp = performance.now()): 
    {[collection: string]: { [key: string]: MapAnimationValue }} {
    const values = {};
    for (const collection in this.propertyCollections) {
      values[collection] = this.getCurrentValues(time, this.propertyCollections[collection]);
    }
    return values;
  }

  public getCurrentValues(time: DOMHighResTimeStamp, properties: MapAnimationProperties = null): {[key: string]: MapAnimationValue} {
    if (properties === null)
      throw new Error("For MapAnimationDeep, call getCurrentValueCollections() instead of getCurrentValues()!");
    return super.getCurrentValues(time, properties);
  }
}