import {
  MapMarker,
  MapMarkerColor,
  MapMarkerCommonState,
  MapMarkerDrawingOptions,
  MapMarkerOptions,
  TextAlign,
  TextBaseline
} from './map-marker';

export interface MapMarkerPartyDrawingOptions extends MapMarkerDrawingOptions {
  dontFillText?: boolean,
  fillStyleText?: MapMarkerColor,
  dontStrokeText?: boolean,
  strokeStyleText?: MapMarkerColor,
  lineWidthText?: number,
}

export const MAP_MARKER_PARTY_DEFAULT_DRAWING_OPTIONS: MapMarkerPartyDrawingOptions = {
  dontFillText: false,
  fillStyleText: "rgb(255,255,255)",
  dontStrokeText: true,
  strokeStyleText: "rgb(255,255,255)",
}

export interface MapMarkerPartyOptions extends MapMarkerOptions {
  state?: MapMarkerCommonState,
  transitionTo?: MapMarkerCommonState,
  text?: string,
  font?: string,
  textAlign?: TextAlign,
  textBaseline?: TextBaseline,
  drawingOptions?: MapMarkerPartyDrawingOptions[]
}

export const MAP_MARKER_PARTY_DEFAULT_OPTIONS: MapMarkerPartyOptions = {
  state: "normal",
  text: null,
  font: "500 7.2px 'DM Sans', sans-serif",
  textAlign: "center", // If set to left, change _textX, too
  textBaseline: "alphabetic"
}

/*
 * A party flag marker
 */
export class MapMarkerParty extends MapMarker {
  public options: MapMarkerPartyOptions;

  protected _width = 22;
  protected _height = 45;
  protected _textX = 11.1862; // For left alignment, use: 2.3799;
  protected _textY = 10.2502;
  protected _anchor = {
    x: 1.465, 
    y: this._height
  };

  constructor(
    public contexts: CanvasRenderingContext2D[],
    options: MapMarkerPartyOptions = {}
  ) {
    super(contexts, { ...MAP_MARKER_PARTY_DEFAULT_OPTIONS, ...options });
    this._mergeDrawingOptions(MAP_MARKER_PARTY_DEFAULT_DRAWING_OPTIONS);
  }

  public get text(): string {
    return this.options.text;
  }

  public set text(v: string) {
    this.options.text = v;
  }

  public get font(): string {
    return this.options.font;
  }

  public set font(v: string) {
    this.options.font = v;
  }

  public get textAlign(): TextAlign {
    return this.options.textAlign;
  }

  public set textAlign(v: TextAlign) {
    this.options.textAlign = v;
  }

  public get textBaseline(): TextBaseline {
    return this.options.textBaseline;
  }

  public set textBaseline(v: TextBaseline) {
    this.options.textBaseline = v;
  }

  protected _drawPath(ctx: CanvasRenderingContext2D): void {

    // Expansion
    if (this.transition) {
      const expansion = this.transitionTo === "normal" ? 
                        this.transitionProgress : 
                        1 - this.transitionProgress;
      ctx.save();
      // Translate to keep the feet at the anchor point
      ctx.translate(0, (1 - expansion) * this._height);
      ctx.scale(1, expansion);
    }

    // Draw the shape
    this._drawFlag(ctx);
    this._fillAndStroke(ctx);

    // Render text if there's one
    if (this.text != null)
      this._renderText(ctx);

    // Restore if we used expansion
    if (this.transition)
      ctx.restore();

  }

  /*
   * This doesn't create a path so fill and stroke are applied at the same time
   */
  protected _renderText(ctx: CanvasRenderingContext2D): void {

    // Special options for text
    const opts = this._getSpecialDrawingOptions(ctx, "Text");

    // Do the rendering
    this._fillAndStrokeText(ctx, this.text, this._textX, this._textY, opts,
      this.font, this.textAlign, this.textBaseline);
  }

  protected _drawFlag(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(13.79, 1.24);
    ctx.lineTo(13.2, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, 45);
    ctx.lineTo(2.93, 45);
    ctx.lineTo(2.93, 14.67);
    ctx.lineTo(11.15, 14.67);
    ctx.lineTo(11.73, 15.91);
    ctx.lineTo(22, 15.91);
    ctx.lineTo(22, 1.24);
    ctx.lineTo(13.79, 1.24);
    ctx.lineTo(13.79, 1.24);
    ctx.closePath();
  }
}