import { 
  MapMarker,
  MapMarkerOptions 
} from './map-marker';

export const MAP_MARKER_CIRCLE_DEFAULT_RADIUS = 5;

export interface MapMarkerCircleOptions extends MapMarkerOptions {
  radius?: number
}

/*
 * TODO This has not been updated to take into account expansion
 * and other updates.
 */
export class MapMarkerCircle extends MapMarker {
  public options: MapMarkerCircleOptions;

  constructor(
    public contexts: CanvasRenderingContext2D[],
    options: MapMarkerCircleOptions = {}
  ) {
    super(contexts, options);
    const r = this.options.radius ??= MAP_MARKER_CIRCLE_DEFAULT_RADIUS;
    this._width = this._height = r * 2;
    this._anchor = {
      x: r, 
      y: r
    };
  }

  protected _drawPath(ctx: CanvasRenderingContext2D): void {
    const r = this.options.radius;
    ctx.moveTo(r * 2, r);
    ctx.arc(r, r, r, 0, 2 * Math.PI);
    this._fillAndStroke(ctx);
  }
}