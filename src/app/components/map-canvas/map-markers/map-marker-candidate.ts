import { 
  MapMarker,
  MapMarkerColor,
  MapMarkerCommonState,
  MapMarkerDrawingOptions,
  MapMarkerOptions
} from './map-marker';

export type MapMarkerCandidateState = MapMarkerCommonState | "active" | "minimised" | "disabled";

export interface MapMarkerCandidateDrawingOptions extends MapMarkerDrawingOptions {
  dontFillBody?: boolean,
  fillStyleBody?: MapMarkerColor,
  dontFillDisabled?: boolean,
  fillStyleDisabled?: MapMarkerColor,
  dontStrokeDisabled?: boolean,
  strokeStyleDisabled?: MapMarkerColor
}

export interface MapMarkerCandidateOptions extends MapMarkerOptions {
  state?: MapMarkerCandidateState,
  transitionTo?: MapMarkerCandidateState,
  disabledHeadScale?: number,
  minimisedHeadScale?: number,
  drawingOptions?: MapMarkerCandidateDrawingOptions[]
}

export const MAP_MARKER_CANDIDATE_DEFAULT_OPTIONS: MapMarkerCandidateOptions = {
  state: "minimised",
  disabledHeadScale: 0.5,
  minimisedHeadScale: 1.0
}

export const MAP_MARKER_CANDIDATE_HEAD_RADIUS = 5;

/*
 * A person marker
 * 
 * You can use transitions to interpolate between states, except
 * active <=> normal
 * Also note that colours are not interpolated.
 * 
 * TODO: Maybe import MapAnimation to interpolate colors
 */
export class MapMarkerCandidate extends MapMarker {
  public options: MapMarkerCandidateOptions;

  // Dimensions are maxima across all the states 
  protected _headX  = 10.9439;
  protected _headY  = 12.2;
  protected _headR  = MAP_MARKER_CANDIDATE_HEAD_RADIUS;
  protected _bodyY  = 63.8041
  protected _width  = 21.9099;
  // We need to add headR here as when there's no body the head's centre is at the feet's origin
  protected _height = this._bodyY + this._headR;
  protected _anchor = {
    x: this._width / 2, 
    y: this._bodyY
  };
  protected _labelY = 5 + this._headR;

  constructor(
    public contexts: CanvasRenderingContext2D[],
    options: MapMarkerCandidateOptions = {}
  ) {
    super(contexts, {...MAP_MARKER_CANDIDATE_DEFAULT_OPTIONS, ...options});
  }

  public get hasBody(): boolean {
    // We are drawing the body if we are either in a bodied state, or
    // transitioning to or from one
    return this._stateHasBody(this.state) || 
          (this.transitionTo != null && this._stateHasBody(this.transitionTo));
  }

  protected _stateHasBody(state: string): boolean {
    return ["normal", "active"].includes(state);
  }

  public get disabled(): boolean {
    return this.state === "disabled" || this.transition?.to === "disabled";
  }

  protected _drawPath(ctx: CanvasRenderingContext2D): void {

    // Initialize these values to one's set by the current state
    const params = this._getDrawingParameters(this.options.state);

    // If there's a transition calculate interim values
    if (this.transition != null) {

      const toParams = this._getDrawingParameters(this.options.transitionTo);

      ["expansion", "bodyExpansion"].forEach(p => {
        params[p] += (toParams[p] - params[p]) * this.transitionProgress;
      });

      // If the target state doesn't have a body but the original one has it,
      // we leave the body untouched. Otherwise use the target body
      if (!(!this._stateHasBody(toParams.body) && this._stateHasBody(params.body)))
        params.body = toParams.body;
    }

    // First, we draw the body if there is one
    if (params.body) {

      // The body has usually a different color, we'll pass this to _fillAndStroke()
      const opts = this._getSpecialDrawingOptions(ctx, "Body");

      // Scale and translate body if it's being expanded
      if (params.bodyExpansion !== 1) {
        ctx.save();
        // Translate to keep the feet at the anchor point
        ctx.translate(0, (1 - params.bodyExpansion) * this._bodyY);
        ctx.scale(1, params.bodyExpansion);
      }

      // Draw the body and fill and stroke with body drawing options
      this.state === "normal" ? this._drawNormalBody(ctx) : this._drawActiveBody(ctx);
      this._fillAndStroke(ctx, opts);

      // Only restore if made some changes
      if (params.bodyExpansion !== 1) ctx.restore();
    }

    // Draw head in any case but we need to check for disabled options if this is disabled
    this._drawHead(ctx, params.expansion, params.bodyExpansion);
    this._fillAndStroke(ctx, this.disabled ? this._getSpecialDrawingOptions(ctx, "Disabled") : undefined);
  }

  /*
   * Used by _draw() to get drawing parameters for a static state and for transitions
   */
  protected _getDrawingParameters(state: MapMarkerCandidateState):
    { expansion: number, bodyExpansion: number, body: "active" | "normal" | null } {

    // Initialize values for "void"
    let expansion = 0, 
        bodyExpansion = 0,
        body = null;

    switch (state) {

      case "disabled":
        expansion = this.options.disabledHeadScale;
        break;

      case "minimised":
        expansion = this.options.minimisedHeadScale;
        break;

      case "normal":
      case "active":
        expansion = 1;
        bodyExpansion = 1;
        body = state;
        break;
    }

    return {
      expansion,
      bodyExpansion,
      body
    }
  }

  protected _drawHead(ctx: CanvasRenderingContext2D, expansion: number = 1, bodyExpansion: number = 0): void {
    const e = expansion,
          b = bodyExpansion,
          x = this._headX,
          // bodyExpansion affects the location of the head only when there is a body
          y = this._headY + (this.hasBody ? 1 - b : 1) * (this._bodyY - this._headY),
          r = e * this._headR;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
  }

  protected _drawNormalBody(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(21.9,39.3);
    ctx.lineTo(20.599999999999998,24.499999999999996);
    ctx.bezierCurveTo(20.499999999999996,23.699999999999996,20.299999999999997,22.999999999999996,19.999999999999996,22.299999999999997);
    ctx.bezierCurveTo(19.499999999999996,21.299999999999997,18.699999999999996,20.499999999999996,17.799999999999997,19.799999999999997);
    ctx.bezierCurveTo(16.799999999999997,19.199999999999996,15.699999999999998,18.799999999999997,14.499999999999996,18.799999999999997);
    ctx.lineTo(7.4999999999999964,18.799999999999997);
    ctx.bezierCurveTo(6.699999999999997,18.799999999999997,5.9999999999999964,18.999999999999996,5.199999999999997,19.199999999999996);
    ctx.bezierCurveTo(4.199999999999997,19.599999999999994,3.1999999999999966,20.299999999999997,2.5999999999999965,21.199999999999996);
    ctx.bezierCurveTo(1.8999999999999966,22.099999999999994,1.4999999999999964,23.199999999999996,1.3999999999999966,24.399999999999995);
    ctx.lineTo(0,39.3);
    ctx.bezierCurveTo(-0.1,40.3,0.6,41.199999999999996,1.6,41.3);
    ctx.bezierCurveTo(2.6,41.4,3.5,40.699999999999996,3.6,39.699999999999996);
    ctx.lineTo(4.7,27);
    ctx.lineTo(5.6000000000000005,27);
    ctx.lineTo(4.3,41.2);
    ctx.bezierCurveTo(4.3,41.300000000000004,4.3,41.5,4.3,41.6);
    ctx.lineTo(6.1,61.7);
    ctx.bezierCurveTo(6.199999999999999,62.900000000000006,7.199999999999999,63.900000000000006,8.399999999999999,63.800000000000004);
    ctx.bezierCurveTo(9.599999999999998,63.7,10.599999999999998,62.7,10.499999999999998,61.50000000000001);
    ctx.lineTo(10.499999999999998,41.6);
    ctx.lineTo(11.399999999999999,41.6);
    ctx.lineTo(11.399999999999999,61.5);
    ctx.bezierCurveTo(11.299999999999999,62.7,12.299999999999999,63.7,13.499999999999998,63.8);
    ctx.bezierCurveTo(14.699999999999998,63.89999999999999,15.7,62.9,15.799999999999997,61.699999999999996);
    ctx.lineTo(15.799999999999997,61.699999999999996);
    ctx.lineTo(17.599999999999998,41.599999999999994);
    ctx.bezierCurveTo(17.599999999999998,41.49999999999999,17.599999999999998,41.3,17.599999999999998,41.199999999999996);
    ctx.lineTo(16.3,27);
    ctx.lineTo(17.2,27);
    ctx.lineTo(18.3,39.7);
    ctx.bezierCurveTo(18.400000000000002,40.7,19.3,41.400000000000006,20.3,41.300000000000004);
    ctx.bezierCurveTo(21.3,41.2,22,40.3,21.9,39.3);
    ctx.bezierCurveTo(21.9,39.3,21.9,39.3,21.9,39.3);
    ctx.closePath();
  }

  protected _drawActiveBody(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(20.2,0);
    ctx.bezierCurveTo(19.2,-0.1,18.3,0.6,18.2,1.6);
    ctx.lineTo(18.2,1.6);
    ctx.lineTo(17,16.5);
    ctx.lineTo(17,16.5);
    ctx.bezierCurveTo(17,16.8,16.9,17.1,16.7,17.4);
    ctx.bezierCurveTo(16.5,17.799999999999997,16.099999999999998,18.2,15.7,18.5);
    ctx.bezierCurveTo(15.299999999999999,18.8,14.799999999999999,18.9,14.399999999999999,18.9);
    ctx.lineTo(7.399999999999999,18.9);
    ctx.bezierCurveTo(6.599999999999999,18.9,5.899999999999999,19.099999999999998,5.099999999999999,19.299999999999997);
    ctx.bezierCurveTo(4.099999999999999,19.699999999999996,3.0999999999999988,20.4,2.4999999999999987,21.299999999999997);
    ctx.bezierCurveTo(1.7999999999999987,22.199999999999996,1.3999999999999986,23.299999999999997,1.2999999999999987,24.499999999999996);
    ctx.lineTo(0,39.3);
    ctx.bezierCurveTo(-0.1,40.3,0.6,41.199999999999996,1.6,41.3);
    ctx.bezierCurveTo(2.6,41.4,3.5,40.699999999999996,3.6,39.699999999999996);
    ctx.lineTo(4.7,27);
    ctx.lineTo(5.6000000000000005,27);
    ctx.lineTo(4.3,41.2);
    ctx.bezierCurveTo(4.3,41.300000000000004,4.3,41.5,4.3,41.6);
    ctx.lineTo(6.1,61.7);
    ctx.bezierCurveTo(6.199999999999999,62.900000000000006,7.199999999999999,63.900000000000006,8.399999999999999,63.800000000000004);
    ctx.bezierCurveTo(9.599999999999998,63.7,10.599999999999998,62.7,10.499999999999998,61.50000000000001);
    ctx.lineTo(10.499999999999998,41.6);
    ctx.lineTo(11.399999999999999,41.6);
    ctx.lineTo(11.399999999999999,61.5);
    ctx.bezierCurveTo(11.299999999999999,62.7,12.299999999999999,63.7,13.499999999999998,63.8);
    ctx.bezierCurveTo(14.699999999999998,63.89999999999999,15.7,62.9,15.799999999999997,61.699999999999996);
    ctx.lineTo(15.799999999999997,61.699999999999996);
    ctx.lineTo(17.599999999999998,41.599999999999994);
    ctx.bezierCurveTo(17.599999999999998,41.49999999999999,17.599999999999998,41.3,17.599999999999998,41.199999999999996);
    ctx.lineTo(16.7,31.399999999999995);
    ctx.bezierCurveTo(16.8,30.899999999999995,16.9,30.299999999999994,17.099999999999998,29.699999999999996);
    ctx.bezierCurveTo(17.599999999999998,27.699999999999996,18.4,25.399999999999995,19.099999999999998,23.199999999999996);
    ctx.bezierCurveTo(19.4,22.099999999999994,19.799999999999997,20.999999999999996,19.999999999999996,19.899999999999995);
    ctx.bezierCurveTo(20.299999999999997,18.899999999999995,20.399999999999995,17.899999999999995,20.599999999999998,16.899999999999995);
    ctx.lineTo(20.599999999999998,16.899999999999995);
    ctx.lineTo(20.599999999999998,16.899999999999995);
    ctx.lineTo(21.9,2);
    ctx.bezierCurveTo(22,1,21.3,0.1,20.2,0);
    ctx.bezierCurveTo(20.3,0,20.3,0,20.2,0);
    ctx.closePath();
  }
}