import * as BezierEasing from 'bezier-easing';

import { MapAnimationColor } from './map-animation-color';

/*
 * MapAnimation
 *
 * A bare-bones class for animating generic properties.
 * The properties can be either a dict of props or 
 * a collection of such dicts if using MapAnimationDeep.
 * 
 * TO DO:
 * 
 * 1. Convert to MapAnimationValueRange<T extends MapAnimationValue>
 * 
 * 3. Convert id and priority to MapAnimationOptions = {
 *    ...
 *    customData?: any
 * }
 */

/*
 * Allowed values to animate.
 * The optional property finally will be set only at the end of
 * the animation but the interim values will be calculated between
 * from and to.
 * Note that strings are only set at the end, not interpolated.
 * Thus, finally for them is the same as to.
 */
export type MapAnimationValue = number | MapAnimationColor | string | boolean;

export type MapAnimationValueRange = {
  from: number,
  to: number,
  finally?: number
} | {
  from: MapAnimationColor,
  to: MapAnimationColor,
  finally?: MapAnimationColor
} | {
  from: string,
  to: string,
  finally?: string
} | {
  from: boolean,
  to: boolean,
  finally?: boolean
}

export type MapAnimationProperties = {
  [key: string]: MapAnimationValueRange
}

export type MapAnimationStartTime = DOMHighResTimeStamp | "first-query";

export type MapAnimationEasing = "bezier" | "linear";

export type MapAnimationOptions = {
  duration?: number,
  // Either explicit time, null to use now, or "first-query" to set 
  // the start time when the animation values are queried for the first time
  start?: MapAnimationStartTime,
  // Added to start time
  delay?: number,
  easing?: MapAnimationEasing,
  // Id, type and priority are not used internally, but maybe queried
  // externally
  id?: string,
  type?: string,
  priority?: number
}

export const MAP_ANIMATION_DEFAULT_OPTIONS: MapAnimationOptions = {
  duration: 1000,
  delay: 0,
  easing: "bezier",
  priority: 0
}

export const BEZIER_EASING = BezierEasing(0.4, 0, 0.2, 1);
export const LINEAR_EASING = (v: number): number => v;

export class MapAnimation {
  /*
   * Mark true for garbage collection.
   */
  public completed: boolean = false;
  readonly options: MapAnimationOptions;
  protected _properties: MapAnimationProperties;

  private _ease: (v: number) => number;

  constructor(
    properties: MapAnimationProperties,
    options: MapAnimationOptions = {}
  ) {
    this.properties = properties;
    this.options = {...MAP_ANIMATION_DEFAULT_OPTIONS, ...options};
    if (this.options.start == null)
      this.options.start = performance.now();
    this._ease = this.options.easing === "bezier" ? BEZIER_EASING : LINEAR_EASING;
  }

  public get id(): string {
    return this.options.id;
  }

  public get priority(): number {
    return this.options.priority;
  }

  public get type(): string {
    return this.options.type;
  }

  /*
   * Subclasses can override these to perform checks
   */
  public get properties(): MapAnimationProperties {
    return this._properties;
  }

  public set properties(v: MapAnimationProperties) {
    this._properties = v;
  }

  /*
   * Check if animation should be completed based on elapsed time
   * Optionally mark as completed
   */
  public isPast(time: DOMHighResTimeStamp = performance.now(), markCompleted: boolean = false): boolean {
    const v = this.options.start === "first-query" ? 
      false : this._start(time) + this.options.duration <= time;
    if (markCompleted && v) this.completed = true;
    return v;
  }

  /*
   * Get all interpolated property values
   */
  public getCurrentValues(time: DOMHighResTimeStamp, properties: MapAnimationProperties = this.properties):
    {[key: string]: MapAnimationValue} {
    const values = {};
    for (const key in properties) {
      values[key] = this._interpolate(properties[key], time);
    }
    return values;
  }

  /*
   * Interpolate a value using interpolation setting
   */
  protected _interpolate(range: MapAnimationValueRange, time: DOMHighResTimeStamp = performance.now()): MapAnimationValue {
    
    let f = (time - this._start(time)) / this.options.duration;
    f = this._ease(this._clamp(f, 0, 1));

    // Finally may have a null value, so we check for the existence of the key itself
    if (f === 1)
      return "finally" in range ? range.finally : range.to;
    
    if (range.from instanceof MapAnimationColor)
      return (range.to as MapAnimationColor).mix(range.from, f);
    else if (typeof range.from === "number")
      return range.from + f * (range.to as number - range.from);
    else
      // We don't do anything to strings or booleans unless f === 1, as above
      return range.from;
  }

  /*
   * Clamp a value between min and max
   */
  protected _clamp(value: number, min: number = 0.0, max: number = 1.0): number {
    return Math.min(Math.max(min, value), max);
  }

  protected _start(time: DOMHighResTimeStamp): DOMHighResTimeStamp {
    if (this.options.start === "first-query")
      this.options.start = time;
    return this.options.start + this.options.duration;
  }
}