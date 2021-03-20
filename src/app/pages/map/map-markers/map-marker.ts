/*
 * This is needed to support MapAnimationColors directly.
 * Note that no checking for legitimate values is done.
 */

export type MapMarkerColor = string | { toString: () => string }
export type TextAlign = "left" | "right" | "center" | "start" | "end";
export type TextBaseline = "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

export interface MapMarkerDrawingOptions {
  dontFill?: boolean,
  dontStroke?: boolean,
  fillStyle?: MapMarkerColor,
  strokeStyle?: MapMarkerColor,
  lineWidth?: number,
  // NB. That opacity will only be applied to explicitly set fill and strokeStyles
  opacity?: number,
  dontFillLabel?: boolean,
  fillStyleLabel?: MapMarkerColor,
  dontStrokeLabel?: boolean,
  strokeStyleLabel?: MapMarkerColor,
  lineWidthLabel?: number,
  opacityLabel?: number,
}

// Must match the ones above
export const BASIC_DRAWING_OPTION_NAMES = [
  "dontFill",
  "dontStroke",
  "fillStyle",
  "strokeStyle",
  "lineWidth",
  "opacity",
];

// For future use
export const MAP_MARKER_DEFAULT_DRAWING_OPTIONS: MapMarkerDrawingOptions = {
}

export interface MapMarkerTransformation {
  translateX?: number,
  translateY?: number,
  scaleX?: number,
  scaleY?: number
}

/*
 * For subclasses create a state that is a union with this and make the state
 * in their options more restrictive. NB. The get and set state accessors should
 * also be overriden.
 */
export type MapMarkerCommonState = "void" | "normal";

/*
 * Note that font settings are not included in per-context drawing options
 * but are global instead.
 */
export interface MapMarkerOptions extends MapMarkerTransformation {
  // Do not compensate scaling for lineWidth
  scaleLineWidth?: boolean,
  // Force drawing even if shape is outside the canvas
  forceDraw?: boolean,
  // Each marker must iplement at least two states 'void' and 'normal'. Void markers should not be drawn.
  // Override allowed state values in subclasses
  state?: MapMarkerCommonState | string,
  // Use to render a marker between states.
  transitionTo?: MapMarkerCommonState | string,
  // Must lie between 0 and 1
  transitionProgress?: number,
  // Whether to show label
  showLabel?: boolean,
  // Marker label
  label?: string,
  // Label font
  fontLabel?: string,
  // Label horizontal alignment
  textAlignLabel?: TextAlign,
  // Label vertical alignment
  textBaselineLabel?: TextBaseline,
  // Supply MapMarkerDrawingOptions for each context
  drawingOptions?: MapMarkerDrawingOptions[]
}

export const MAP_MARKER_DEFAULT_OPTIONS: MapMarkerOptions = {
  translateX: 0,
  translateY: 0,
  scaleX: 1.0,
  scaleY: 1.0,
  scaleLineWidth: false,
  forceDraw: false,
  state: "normal",
  showLabel: false,
  label: null,
  fontLabel: "500 12px 'DM Sans', sans-serif",
  textAlignLabel: "center",
  textBaselineLabel: "top",
  drawingOptions: [],
}

export const MAP_MARKER_GLOBAL_SETTINGS = {
  // The margin by which a marker can be outside the canvas and still drawn
  // When using labels, it's good to have a positive margin as their dimensions
  // are currently not included in the _isWithinCanvas() calculations
  drawOutsideMargin: 50
}

/*
 * Used by _setOpacity()
 */
const COLOR_REGEX = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01](?:\.\d*)?))?\s*?\)/i;

export abstract class MapMarker {
  public debug: boolean = false;
  public options: MapMarkerOptions;
  protected _height = 0;
  protected _width = 0;
  protected _anchor = {
    x: 0, 
    y: 0
  };
  // Label distances are measure from the anchor
  protected _labelX = 0;
  protected _labelY = 5;

  constructor(
    public contexts: CanvasRenderingContext2D[],
    options: MapMarkerOptions = {}
  ) {
    this.options = { ...MAP_MARKER_DEFAULT_OPTIONS, ...options };
    this._mergeDrawingOptions(MAP_MARKER_DEFAULT_DRAWING_OPTIONS);

    if (this.options.drawingOptions.length > this.contexts.length)
      throw new Error("The number of drawingOptions exceeds that of contexts!");

    if (new Set(this.contexts).size !== this.contexts.length)
      throw new Error("Contexts may not contain duplicates!");
    
    // Make sure expansion is between 0 and 1
    if (this.options.transitionProgress != null)
      this._checkProgress(this.options.transitionProgress);
  }

  /*
   * Define the shapes to draw in overrides of this method.
   * Drawing has to start from the top left corner (excluding stroke).
   * Be sure to include a call to this._fillAndStroke(ctx) at the end.
   * Also handle any transitions here.
   */
  protected _drawPath(ctx: CanvasRenderingContext2D): void {
    // Define the shapes to draw here and call this._fillAndStroke(ctx) at the end.
    // Drawing has to start from the top left corner  (excluding stroke).
    // If using canvsg to convert SVG files at, e.g., http://demo.qunee.com/svg2canvas/
    // do the following cleanup:
    // 1. Remove rotate
    // 2. Translate + arc(0,0) => arc(x,y)
    // 3. Remove remaining translates
    throw new Error("Not implemented!");
  }

  /*
   * This can be overriden if needed
   */
  protected _drawLabel(ctx: CanvasRenderingContext2D): void {
    // Draw the label
    // NB. That this happens without the scaling context of the markers
    // but we are already translated to the anchor point
    this._fillAndStrokeText(
      ctx, 
      this.label, this._labelX, this._labelY, 
      this._getSpecialDrawingOptions(ctx, "Label"),
      this.options.fontLabel, this.options.textAlignLabel, this.options.textBaselineLabel
    );
  }

  /*
   * Call this to draw the shapes and labels
   * Returns true for each canvas on which something was drawn, ie., 
   * it was within the canvas.
   * If you want to draw the labels in front of everything else, you
   * can first iterate through all markers drawing just the shapes,
   * collect the ones that draw() returns true and then iterata over
   * those to draw only the visible labels.
   * With the optional argument one can exclude contexts by passing
   * true for each context to exclude
   */
  public draw(drawShape: boolean = true, drawLabel: boolean = true, excludeContexts?: boolean[]): boolean[] {

    // Draw nothing if the state is void and not transitioning
    if (this.state === "void" && this.transitionTo == null)
      return this.contexts.map(_ => false);

    // Iterate over contexts and draw if needed
    return this.contexts.map((ctx, i) => {

      let drewSomething = false;

      if ((excludeContexts == null || !excludeContexts[i]) &&
          (this.options.forceDraw || this._isWithinCanvas(ctx, MAP_MARKER_GLOBAL_SETTINGS.drawOutsideMargin))) {
        // TODO: First, translate to anchor, draw label; then to drawing origin, draw shape

        // Draw the shape
        if (drawShape) {
          this._setTransformation(ctx);
          ctx.beginPath();
          this._drawPath(ctx);
          this._resetTransformation(ctx);
          drewSomething = true;
        }

        // Draw the label if needed
        if (drawLabel && this.showLabel && this.label != null) {
          // For the label we don't use scaling
          ctx.save();
          ctx.translate(this.options.translateX, this.options.translateY);
          this._drawLabel(ctx);
          ctx.restore();
          drewSomething = true;
        }
      }

      return drewSomething;
    });

  }

  /*
   * Call this to just draw the label
   */
  public drawLabel(excludeContexts?: boolean[]): boolean[] {
    return this.draw(false, true, excludeContexts);
  }

  /******************************************
   * GETTERS AND SETTERS
   ******************************************/

  public get state(): MapMarkerCommonState | string {
    return this.options.state;
  }

  public set state(v: MapMarkerCommonState | string) {
    this.options.state = v;
  }

  public get transition(): {to: MapMarkerCommonState | string, progress: number} {
    if (this.transitionTo == null || this.transitionProgress == null)
      return undefined;
    return {
      to: this.transitionTo,
      progress: this.transitionProgress
    }
  }

  public set transition(v: {to: MapMarkerCommonState | string, progress: number}) {
    this.transitionProgress = v.progress;
    this.transitionTo = v.to;
  }

  public get transitionProgress(): number {
    return this.options.transitionProgress;
  }

  public set transitionProgress(v: number) {
    this._checkProgress(v);
    this.options.transitionProgress = v;
  }

  public get transitionTo(): MapMarkerCommonState | string {
    return this.options.transitionTo;
  }

  public set transitionTo(v: MapMarkerCommonState | string) {
    this.options.transitionTo = v;
  }

  /*
   * Get actual width after scaling exluding line width
   */
  public get width(): number {
    return this.options.scaleX * this._width;
  }

  /*
   * Get actual height after scaling exluding line width
   */
  public get height(): number {
    return this.options.scaleY * this._height;
  }

  /*
   * Get actual drawing origin after scaling, ie. top-left corner, exluding line width
   */
  public get origin(): [x: number, y: number] {
    return [
      this.options.translateX - this.options.scaleX * this._anchor.x,
      this.options.translateY - this.options.scaleY * this._anchor.y
    ];
  }

  /*
   * Get transformation
   */
  public get transformation(): MapMarkerTransformation {
    return {
      translateX: this.options.translateX,
      translateY: this.options.translateY,
      scaleX: this.options.scaleX,
      scaleY: this.options.scaleY
    }
  }

  /*
   * Set transformation
   * NB. the new values are merged into old ones.
   */
  public set transformation(t: MapMarkerTransformation) {
    ["translateX", "translateY", "scaleX", "scaleY"]
      .filter(k => t[k] !== undefined)
      .forEach(k => this.options[k] = t[k]);
  }

  /*
   * Get drawing options
   */
  public get drawingOptions(): MapMarkerDrawingOptions[] {
    return this.options.drawingOptions;
  }

  /*
   * Set drawing options
   * NB. the new ones are merged into old ones.
   */
  public set drawingOptions(opts: MapMarkerDrawingOptions[]) {
    opts.forEach((o, i) => {
      if (i >= this.contexts.length) throw new Error("The number of drawingOptions exceeds that of contexts!");
      this.drawingOptions[i] ??= {};
      Object.assign(this.drawingOptions[i], o);
    });
  }

  public get label(): string {
    return this.options.label;
  }

  public set label(v: string) {
    this.options.label = v;
  }

  public get showLabel(): boolean {
    return this.options.showLabel;
  }

  public set showLabel(v: boolean) {
    this.options.showLabel = v;
  }

  /*
   * Test if click is a point is inside the bounding rectangle
   * N.B. This doesn't include the possible label, so if checking for
   * a click on the label, this is likely to return false
   */
  public isInside(x: number, y: number, ctx: CanvasRenderingContext2D = this.contexts[0], margin: number = 0): boolean {
    // TODO: Allow for checking if within label using ctx.measureText()
    const b = this._getBoundingPoints(ctx);
    return b[0] - margin <= x && b[2] + margin >= x &&
      b[1] - margin <= y && b[3] + margin >= y;
  }


  /*
   * Internals
   */

  protected _isWithinCanvas(ctx: CanvasRenderingContext2D, margin: number = 0): boolean {
    // We add the lineWidth to the dimensions. NB. This assumes it's aligned on the shape.
    const b = this._getBoundingPoints(ctx),
      cw = ctx.canvas.width,
      ch = ctx.canvas.height;
    return b[2] + margin > 0 && b[0] - margin < cw &&
      b[3] + margin > 0 && b[1] - margin < ch;
  }

  protected _getBoundingPoints(ctx: CanvasRenderingContext2D): [x1: number, y1: number, x2: number, y2: number] {
    // We add the lineWidth to the dimensions. NB. This assumes it's aligned on the shape.
    const o = this.origin,
      lw = this._getLineWidth(ctx),
      w = this.width + lw,
      h = this.height + lw,
      x = o[0] - lw / 2,
      y = o[1] - lw / 2;
    return [x, y, x + w, y + h];
  }

  /*
   * If drawing options are passed, they will be used 
   * instead of the ones defined for the context
   */
  protected _getLineWidth(ctx: CanvasRenderingContext2D, opts?: MapMarkerDrawingOptions): number {
    opts ??= this._getDrawingOptions(ctx);
    let width = opts.lineWidth != null ? opts.lineWidth : (ctx.lineWidth ?? 0);
    // Conserve lineWidth in spite of scaling
    if (!this.options.scaleLineWidth)
      width /= Math.max(this.options.scaleX, this.options.scaleY);
    return width;
  }

  /*
   * If drawing options are passed, they will be used 
   * instead of the ones defined for the context
   */
  protected _fillAndStroke(ctx: CanvasRenderingContext2D, opts?: MapMarkerDrawingOptions): void {
    opts ??= this._getDrawingOptions(ctx);
    ctx.save();
    if (!opts.dontStroke) {
      if (opts.strokeStyle) ctx.strokeStyle = this._color(opts.strokeStyle, opts);
      ctx.lineWidth = this._getLineWidth(ctx, opts);
      ctx.stroke();
    }
    if (!opts.dontFill) {
      if (opts.fillStyle) ctx.fillStyle = this._color(opts.fillStyle, opts);
      ctx.fill();
    }
    ctx.restore();
  }

  protected _findContextIndex(ctx: CanvasRenderingContext2D): number {
    for (let i = 0; i < this.contexts.length; i++) {
      if (ctx === this.contexts[i]) return i;
    }
    throw new Error("Context not found!");
  }

  protected _getDrawingOptions(ctx: CanvasRenderingContext2D): MapMarkerDrawingOptions {
    const i = this._findContextIndex(ctx);
    return this.options.drawingOptions[i] ?? {};
  }


  /*
   * Fill and stroke any text
   */
  protected _fillAndStrokeText(ctx: CanvasRenderingContext2D, 
    text: string, textX: number, textY: number, 
    opts: MapMarkerDrawingOptions, 
    font?: string, textAlign?: TextAlign, textBaseline?: TextBaseline): void {
    
    // Save, as we are making changes
    ctx.save();

    // Set font options
    if (font !== undefined)
      ctx.font = font;
    if (textAlign !== undefined)
      ctx.textAlign = textAlign;
    if (textBaseline !== undefined)
      ctx.textBaseline = textBaseline;

    // Fill and sroke if needed
    if (!opts.dontStroke) {
      if (opts.strokeStyle !== undefined)
        ctx.strokeStyle = this._color(opts.strokeStyle, opts);
      ctx.lineWidth = this._getLineWidth(ctx, opts);
      ctx.strokeText(text, textX, textY);
    }
    if (!opts.dontFill) {
      if (opts.fillStyle !== undefined)
        ctx.fillStyle = this._color(opts.fillStyle, opts);
      ctx.fillText(text, textX, textY);
    }

    // Restore ctx
    ctx.restore();
  }

  /*
   * Get merged drawing options where suffixed options replace defaults, e.g., 
   * fillStyleBody -> fillStyle for MapMarkerCandidate
   */
  protected _getSpecialDrawingOptions(ctx: CanvasRenderingContext2D, suffix: string): MapMarkerDrawingOptions {
    const opts = this._getDrawingOptions(ctx);
    const out: MapMarkerDrawingOptions = { ...opts };
    BASIC_DRAWING_OPTION_NAMES.forEach(o => {
      const key = o + suffix;
      if (key in opts)
        out[o] = opts[key];
    });
    return out;
  }

  /*
   * Merge default drawing options with existing ones
   */
  protected _mergeDrawingOptions(opts: MapMarkerDrawingOptions): void {
    for (let i = 0; i < this.drawingOptions.length; i++)
      this.drawingOptions[i] = { ...opts, ...this.drawingOptions[i] }
  }

  protected _setTransformation(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // This also takes into account the translation
    ctx.translate(...this.origin);
    if (this.options.scaleX !== 1 || this.options.scaleY !== 1)
      ctx.scale(this.options.scaleX, this.options.scaleY);
  }

  protected _resetTransformation(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  protected _color(value: MapMarkerColor, opts?: MapMarkerDrawingOptions): string {
    const out = this._colorAsString(value);
    if (opts && opts.opacity != null && opts.opacity !== 1)
      return this._setOpacity(out, opts.opacity);
    else
      return out;
  }

  protected _colorAsString(value: MapMarkerColor): string  {
    return typeof value === "string" ? value : value.toString();
  }

  /*
   * Perform a simple opacity transformation on a color string.
   * For simplicity, this doesn't utilise a color object.
   * Opacity 
   */
  protected _setOpacity(color: string, opacity: number): string {
    if (opacity < 0 || opacity > 1)
      throw new Error("Opacity must be between 0 and 1!");
    const m = color.match(COLOR_REGEX);
    if (m) {
      const alpha = Number(m[4] == null ? 1 : m[4]) * opacity;
      return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
    } else {
      throw new Error(`Couldn't parse color string '${color}'!`);
    }
  }

  protected _checkProgress(v: number): void {
    if (v < 0 || v > 1) throw new Error("Progress must be between 0 and 1!");
  }
}