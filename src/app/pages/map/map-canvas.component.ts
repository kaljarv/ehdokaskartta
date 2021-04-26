import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import { 
  Subscription 
} from 'rxjs';

import { 
  ANIMATION_DURATION_MS,
  D3Service
} from '../../core';

import {
  MapMarkerCommonState
} from './map-markers/';

import {
  MapDatum,
  MapDatumCandidate,
  MapDatumParty,
  MapDatumVoter
} from './map-data/';

import {
  MapAnimationColor,
  MapAnimationDeep,
  MapAnimationOptions,
  MapAnimationPropertiesDeep
} from './map-animation/';

/*
 * MapCanvasComponent
 * 
 * Implements the map by drawing markers on the canvas. It provides click
 * interactions but no hovers. Also some limited animations are enabled.
 * 
 * In the future, this should be developed to allow for the following.
 * Now, the implementation is messy :(.
 * 
 * TODO / Future considerations:
 * 
 * 2. Multiple staggered animations launched at the same time. When starting
 * multiple animations, the start time for all should be set to the last one's
 * time and then staggered based on that.
 *
 * 3. Maybe implement a copy of the Marker list to track entering and exiting
 * markers in the same way as Angular does with :enter/:exit.
 * 
 * 4. Convert DEFAULTS in MapMarkers so that they are not copied but fetched
 * at runtime if no overrides are set.
 * 
 * 6. Structure options differently so that special collections can be set
 * up without need for suffices. Also think of setting up inheritance.
 * 
 * 7. Maybe explicitly treat the first context as different for markers,
 * and treat the rest as secondary contexts, which will only be drawn onto
 * if explicitly defined. Or smth.
 * 
 * 8. Get label font style from the canvas element's computed style.
 */

/*
 * Marker click event data
 */
export type MapMarkerClickData = {
  datum: MapDatum,
  x: number,
  y: number
}

/*
 * Redraw requirements
 * RedrawOnly is the default
 */
export enum MapRedrawOptions {
  RedrawOnly,
  ReSort,
  ReInitialize
}

export type MapBackgroundType = 'none' | 'default' | 'radar';


/*  
 * Utility
 */
function clamp(value: number, min: number = 0.0, max: number = 1.0): number {
  return Math.min(Math.max(min, value), max);
}

/*
 * <app-map-canvas>
 */
@Component({
  selector: 'app-map-canvas',
  template: '<canvas #canvas [width]="width" [height]="height" (click)="onCanvasClick($event)"></canvas>',
  styleUrls: ['./map-canvas.component.sass'],
  host: {
    '(window:resize)': 'onWindowResize()'
  }
})
export class MapCanvasComponent implements AfterViewInit, OnChanges, OnInit, OnDestroy {

  /*
   * The markers  to draw in any order
   */
  @Input() markerData: Array<MapDatum>;

  /*
   * This controls the scaling of the x and y coordinates
   */
  @Input() coordinateScale: number = 1;

  /*
   * Emit this whenever redraw is needed
   * NB. This will reinitialize and re-sort the markers
   */
  @Input() redrawEmitter: EventEmitter<MapRedrawOptions>;

  /*
   */
  @Input() zoomEmitter: EventEmitter<{x: number, y: number}>;

  /*
   * Animation speed in ms
   */
  @Input() animationDuration: number = 300;

  /*
   * Animation stagger in ms for animations involving multiple elements,
   * such as enter, exit and appearance of text labels
   * NB. Not used currently
   */
  @Input() animationStagger: number = ANIMATION_DURATION_MS;

  /*
   * The background image to draw. Possible values:
   * 'default' -- concentric circles and radii on voter
   * 'radar' -- only the upper half of that above
   * 'none' -- no background
   */
  @Input() backgroundType: MapBackgroundType = 'default';

  /*
   * This should match $color-secondary in the sass definitions
   */
  @Input() backgroundLineColor: string = "rgb(180,180,180)";

  /*
   * This should match $color-secondary in the sass definitions
   */
  @Input() disabledMarkerColor: string = "rgb(128,128,128)";

  /*
   * The map centre in the projection space, i.e. canvas dimensions
   * divided by coordinate scale
   */
  @Input() mapCentre: {x: number; y: number} = {x: 0.5, y: 0.5};

  /*
   * This should match $color-secondary in the sass definitions
   */
  @Input() markerBodyColor: string = "rgb(128,128,128)";

  /*
   * This should match $color-primary in the sass definitions
   */
  @Input() markerLabelColor: string = "rgba(0,0,0,0.87)";

  /*
   * Width of marker outline in pixels. NB. The stroke is aligned with
   * the centre of the path, so only half of it is actually visible
   * (or invisible, as the outline is of the bg colour)
   */
  @Input() markerOutlineWidth: number = 2;

  /*
   * Global scaling for markers of all types
   */
  @Input() markerScale: number = 1.0;

  /*
   * This controls the scaling of the minimized candidate markers at lower zoom levels.
   * Set this below 1 when there are many candidates (> 200).
   */
  @Input() minimizedCandidateScale: number = 1.0;

  /*
   * The minimun unitless dimension factor to show labels at, set lower to show them sooner
   */
  @Input() showLabelsAtFactor: number = 10 * 0.8; // 2e4;

  /*
   * The opacity of the voter map marker to allow seeing candidates behind it.
   */
  @Input() voterMarkerOpacity: number = 0.6;

  /*
   * Max and min zoom levels
   */
  @Input() zoomExtents: number[] = [0.8, 15];

  /*
   * Zoom duration
   */
  @Input() zoomDuration: number = 500;

  /*
   * The threshold value for computed minimizedMarkerScale under which
   * all clicks are treated as calls to zoom
   */
  @Input() zoomOnClickThreshold: number = 0.6;

  /*
   * Fired when the canvas background is cliced
   */
  @Output() onBgClick = new EventEmitter<void>();

  /*
   * Fired when a marker is clicked.
   */
  @Output() onMarkerClick = new EventEmitter<MapMarkerClickData>();

  @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement>;

  // Values controlling the coordinates and scales of markers
  private _coordinateFactors = {
    coordinateScale: 1,
    xOffset: 0, // Global offset
    yOffset: 0,
    zoomScale: 1,
    zoomXOffset: 0,
    zoomYOffset: 0,
    marginFraction: 0.02, // Margin as fraction of total dim
    markerScale: 1,
    maxDistance: Math.sqrt(2), // Distance from corner to corner in the projection space
    minimizedMarkerScale: 1
  };

  // The additional offset of a shape's clickable area
  private _clickBleed = 2;
  private _canvasInitialized = false;

  // Used by d3.zoom
  private _zoomElement: any;
  private _zoomFunction: any;
  // How much further (on zoom level 1 dimensions) than the window size to allow zooming
  // TODO: Change to a dynamically calculated one
  private _zoomTranslateExtentMargin = 250;

  // How to scale markers when zooming
  // The nth root of zoomScale which is used to scale the avatar
  private _zoomMarkerScalingRoot = 4; 
  // The min and max values for zoom based scaling calculated by the root above
  private _zoomMarkerScalingRange = [0.8, 1.6];

  // Used to calculate disabled marker size based on minimizedCandidateScale
  private _disabledCandidateHeadScalingFactor = 0.5;

  private _animations = new Set<MapAnimationDeep>();
  // We can set this flag to request a redraw even if no animations are running
  private _requestRedrawFlag = false;
  // We save a reference to the voter here, as we need to separate it in _draw()
  private _voterDatum: MapDatumVoter;
  private _bgColor = "rgb(255,255,255)";
  private _hitColor2Marker: { [color: string]: MapDatum };
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _hitCanvas: HTMLCanvasElement;
  private _hitContext: CanvasRenderingContext2D;
  private _pixelRatio = 1.0;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  constructor(
    private d3: D3Service,
    private ngZone: NgZone
  ) {}

  public get width(): number | undefined {
    return window.innerWidth;
  }

  public get height(): number | undefined {
    return window.innerHeight;
  }

  ngOnInit() {
    this._subscriptions.push(this.redrawEmitter.subscribe(
      (v: MapRedrawOptions) => this._applyDataChanges(v)
    ));
    this._subscriptions.push(this.zoomEmitter.subscribe(
      (d: {x: number; y: number}) => this._zoomTo(d.x, d.y)
    ));
  }

  ngAfterViewInit() {
    this._initCanvas();
    this._rescale();
    if (this.markerData?.length > 0)
      this._applyDataChanges(MapRedrawOptions.ReInitialize);
  }

  ngOnChanges() {
    if (this._canvasInitialized)
      this._applyDataChanges(MapRedrawOptions.ReInitialize);
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  public onWindowResize(): void {
    this._rescale();
  }

  private _applyDataChanges(options: MapRedrawOptions = MapRedrawOptions.RedrawOnly) {

    // To make sure these are up-to-date
    this._calcCoordinateFactors();

    // If the changes are deep, either re-init or re-sort
    if (options === MapRedrawOptions.ReInitialize)
      this._initMarkers();
    else if (options === MapRedrawOptions.ReSort)
      this._sortMarkers();
    
    // Finally run basic updates
    this._updateMarkerData();
  }

  /*
   * Handle changes in canvas, i.e., window size.
   * Also called on intialization.
   */
  private _rescale(): void {

    this._updateZoomExtents();
    this._calcCoordinateFactors();

    // Set size and resolution for both the real canvas and the hit one
    const w = this.width;
    const h = this.height;
    const r = this._pixelRatio;

    [this._canvas, this._hitCanvas].forEach(c => {
      // Set style width in CSS units
      c.style.width = w + "px";
      c.style.height = h + "px";

      // Set actual size in memory (scaled to account for extra pixel density).
      c.width = Math.floor(w * r);
      c.height = Math.floor(h * r);

      // Normalize coordinate system to use css pixels.
      c.getContext("2d").scale(r, r);
    })

    this.redraw();
  }

  /****************************************************************
   * INITIALIZATION
   ****************************************************************/

  private _initCanvas(): void {
    this._pixelRatio = window.devicePixelRatio;
    this._canvas = this.canvasRef.nativeElement;
    this._context = this._canvas.getContext("2d");
    this._hitCanvas = document.createElement("canvas");
    this._hitContext = this._hitCanvas.getContext("2d");
    this._bgColor = window.getComputedStyle(this._canvas)?.getPropertyValue("background-color") ?? this._bgColor;
    this._setupZoomability();
    this._canvasInitialized = true;
  }

  private _initMarkers(): void {
    // We need to update zoom extents here as the extents set by map.component are
    // tied to the number of markers
    this._updateZoomExtents();
    this._sortMarkers();
    this._assignHitColors();
    this._prepareMarkerData();
  }

  /*
   * Sort markers in the correct drawing order, i.e,
   * by layer, y and x coordinates in ascending order
   */
  private _sortMarkers(): void {
    this.markerData.sort((a, b) => {
      let diff = (a.options.layer ?? 0) - (b.options.layer ?? 0);
      if (diff === 0) diff = a.options.y - b.options.y;
      if (diff === 0) diff = a.options.x - b.options.x;
      return diff;
    });
  }

  /*
   * Build a dict of unique colors to match to MapMarkers for hit tests
   * We try to differentiate the colors as much as possible so as to avoid
   * false hits because of antialiasing.
   */
  private _assignHitColors(): void {

    // Reset
    this._hitColor2Marker = {};
    
    // Create colors in decimal form
    const colors = [];
    // Decimal step for each color
    const step = 255**3 / this.markerData.length;
    // Add a color for each marker. Note that this never reaches white, which
    // is reserved for the background
    for (let i = 0; i < this.markerData.length; i++) {
      colors.push(Math.floor(step * i));
    }

    // Convert decimal to rgb
    const _toRgb = (v: number) => [v/256**2, v/256, v].map(x => Math.floor(x) % 256);

    // Now we assign colors randomly so as to minimized the chance that neighbouring
    // markers have similar colors, which can get mixed up because of antialiasing
    this._shuffle(colors);
    for (let i = 0; i < this.markerData.length; i++) {
      const rgb = _toRgb(colors[i]).join(",");
      this._hitColor2Marker[rgb] = this.markerData[i];
      this.markerData[i].options.hitColor = `rgb(${rgb})`;
    }

  }

  /*
   * Create MapMarker objects for each marker and update data objects
   */
  private _prepareMarkerData(): void {

    const ctx = [this._context, this._hitContext];

    // We clear this, in case the markers were changed not to include the voter
    this._voterDatum = undefined;

    this.markerData.forEach((m: MapDatum, i: number) => {

      // Defaults for marker opts
      const opts = {
        label: m.options.label,
        state: "void" as MapMarkerCommonState
      }
      // Defaults for visible canvas
      const drawingOpts = {
        fillStyle: m.options.color,
        fillStyleLabel: this.markerLabelColor,
        strokeStyle: this._bgColor,
      }
      // Defaults for hitCanvas
      const hitOpts = {
        fillStyle: m.options.hitColor,
        // Extend hit area
        strokeStyle: m.options.hitColor,
        // Allow hit for labels, too
        // Doesn't work currently, see marker.isInside()
        // fillStyleLabel: m.hitColor,
        // strokeStyleLabel: m.hitColor
        dontFillLabel: true,
        dontStrokeLabel: true
      }

      if (m instanceof MapDatumVoter) {

        // Save a reference for use in _draw()
        this._voterDatum = m;

        m.initMarker(
          ctx,
          { ...opts,
            drawingOptions: [
              // Visible canvas
              { ...drawingOpts,
                fillStyleBody: m.options.color
              },
              // Hit canvas
              hitOpts
            ]
          }
        );
        this._animate(m, {
            drawingOptions: {
              opacity: { from: 1, to: this.voterMarkerOpacity }
            }
          }, {
            duration: 2000,
            delay: 5000,
            start: "first-query"
          }
        );

      } else if (m instanceof MapDatumCandidate) {

        m.initMarker(
          ctx,
          { ...opts,
            // Nb. We set this, as this._updateMinimizedCandidateScale() won't be called
            // if this.minimizedCandidateScale === 1
            minimizedHeadScale: this._disabledCandidateHeadScalingFactor,
            drawingOptions: [
              // Visible canvas
              { ...drawingOpts,
                fillStyleBody: this.markerBodyColor,
                fillStyleDisabled: this.disabledMarkerColor
              },
              // Hit canvas
              // No interactions for disabled markers
              { ...hitOpts,
                dontFillDisabled: true,
                dontStrokeDisabled: true
              }
            ]
          }
        );

      } else if (m instanceof MapDatumParty) {

        m.initMarker(
          ctx,
          { ...opts,
            text: m.options.text,
            drawingOptions: [
              // Visible canvas
              drawingOpts,
              // Hit canvas
              {...hitOpts,
                dontFillText: true,
                dontStrokeText: true
              }
            ]
          }
        );

      } else {

        throw new Error(`MapDatum of type '${m.constructor.name}' not implemented!`);
      }

    });
  }

  /*
   * Randomly shuffle an array
   * Courtesy of CoolAJ86 et al.
   * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  private _shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  /*
   * Set up d3 zoom
   */
  private _setupZoomability(): void {

    const d3 = this.d3.d3;

    this._zoomElement = d3.select(this._canvas);

    const zoomed = () => {
      const transform = d3.event.transform;
      this._coordinateFactors.zoomScale = transform.k;
      this._coordinateFactors.zoomXOffset = transform.x;
      this._coordinateFactors.zoomYOffset = transform.y;
      this._calcCoordinateFactors();
      this._updateZoomed();
    };

    const dblClickZoom = () =>  {
      // Zoom to the level were labels are visible
      const k = this.labelThreshholdZoomLevel;
      const t = d3.zoomTransform(d3.event.target);
      const x = (d3.event.offsetX - t.x) / t.k,
            y = (d3.event.offsetY - t.y) / t.k;
      this._zoomTo(x, y, k);
    }

    this._zoomFunction = d3.zoom()
      .on("zoom", zoomed)
      .clickDistance(10);
    
    // We set the translate and scale extents here as they need to be reset
    // when rescaling
    this._updateZoomExtents();

    this._zoomElement.call(this._zoomFunction)
      .on("dblclick.zoom", dblClickZoom);
  }

  /*
   * Update zoom extents when dimensions change
   */
  private _updateZoomExtents(): void {
    if (this._zoomFunction)
      this._zoomFunction
        .scaleExtent(this.zoomExtents)
        .translateExtent([
          [-this._zoomTranslateExtentMargin, -this._zoomTranslateExtentMargin],
          [window.innerWidth + this._zoomTranslateExtentMargin, window.innerHeight + this._zoomTranslateExtentMargin]
        ]);
  }

  /****************************************************************
   * UPDATING MARKERS
   ****************************************************************/

  /*
   * Called after changes that do not require reinitialization
   */
  private _updateMarkerData(): void {
    // For performance reasons, we use the same animation object 
    // for all simultaneous transitions
    // Used for animation ids
    const idRoot = performance.now() + "_";

    this.markerData.forEach(m => {
      this._updateTransitions(m, idRoot);
      this._updateMinimizedCandidateScale(m, idRoot);
      this._updateLabels(m, idRoot);
    });

    this.redraw();
  }

  /*
   * Called after changes to zoom level
   */
  private _updateZoomed(): void {
    
    // Used for animation ids
    const idRoot = performance.now() + "_";

    this.markerData.forEach(m => {
      // Labels and minimized cand scale are dependent on the zoom level
      // TODO Only check if there's a change in the global zoom label factor
      this._updateMinimizedCandidateScale(m, idRoot);
      this._updateLabels(m, idRoot);
    });

    this.redraw();
  }

  /*
   * Apply any transitions specified in the datum options.
   * Currently only transitions to a marker state or explicitly
   * showing or hiding the label are supported. See also the
   * MapDatumTransition interface.
   */
  private _updateTransitions(m: MapDatum, idRoot: string): void {

    if (!m.options.transition || Object.keys(m.options.transition).length === 0)
      return;

    // Check that the transition is valid
    Object.keys(m.options.transition).forEach(k => {
      if (!["state", "showLabel"].includes(k))
        throw new Error(`Unimplemented MapDatum transition '${k}'!`);
    });

    if (m.options.transition.showLabel != null) {
      // Animate label to or from view
      // First set the datum showLabel value to true to force 
      // visibility (even if we are fading the label out).
      // NB. _updateLabels() will propagate this change to the
      // marker object itself.
      m.options.showLabel = true;

      // Remove possibly conflicting animations
      m.removeAnimationsByType("label");
      
      // Create animation
      if (m.options.transition.showLabel) {
        // We show these labels in the front
        m.options.labelInFront = true;
        // Show the label
        this._animate(m,
          { drawingOptions: {
              opacityLabel: { from: 0, to: 1 }
            }
          },
          // For possible clearing, see above
          { type: "label" },
          // Global id
          `${idRoot}-showLabel`
        );

      } else {
        // Hide the label
        this._animate(m,
          { drawingOptions: {
              opacityLabel: { from: 1, to: 0 }
            },
            // We need to clear the showLabel and labelInFront values from the datum in the end
            datumOptions: {
              showLabel: { from: true, to: null },
              labelInFront: { from: true, to: null }
            }
          },
          { type: "label" },
          `${idRoot}-hideLabel`
        );
      }
    }

    if (m.options.transition.state != null) {
      // Transition between states
      const state = m.options.transition.state;

      m.removeAnimationsByType("state");
      
      // Animate
      this._animate(m,
        { markerOptions: {
            transitionProgress: { from: 0, to: 1, finally: null },
            // The special value '*' means that no changes are needed before the end
            state: { from: "*", to: state },
            // Remove the transition property in the end
            transitionTo: { from: state, to: null }
          }
        },
        // For possible clearing, see above
        { type: "state" },
        // Global ids for equal transitions
        `${idRoot}-state-${state}`
      );
    }

    // Clear transition now that we've converted it to an animation
    delete m.options.transition;
  }

  /*
   * Set the minimizedHeadScale value for candidate markers based on the zoom level
   */
  private _updateMinimizedCandidateScale(m: MapDatum, idRoot: string): void {

    if (this._coordinateFactors.minimizedMarkerScale !== 1 && m instanceof MapDatumCandidate) {
      m.marker.options.minimizedHeadScale = this._coordinateFactors.minimizedMarkerScale;
      m.marker.options.disabledHeadScale = this._disabledCandidateHeadScalingFactor * m.marker.options.minimizedHeadScale;
    }

  }

  /*
   * Update the marker's showLabel and opacityLabel values based on either
   * values explicitly set in the datum or by the global label policy
   * based on the zoom level.
   */
  private _updateLabels(m: MapDatum, idRoot: string): void {

    if (m.options.showLabel != null) {
      // Explictly set showLabel value
      m.marker.showLabel = m.options.showLabel;

    } else if (m.marker.state === "void" || m.marker.state === "disabled" ||
               this.globalLabelOpacity === 0) {
      // Labels aren't shown for void or disabled markers or if the zoom 
      // level is too low
      m.marker.showLabel = false;

    } else {
      // Zoom level is past the threshold, so show label and set the opacity
      m.marker.showLabel = true;
      m.marker.drawingOptions[0].opacityLabel = this.globalLabelOpacity;
    }
  }

  public get labelThreshholdZoomLevel(): number {
    return this.showLabelsAtFactor / this.markerScale;
  }

  public get globalLabelOpacity(): number {
    return clamp(this._coordinateFactors.zoomScale * this.markerScale + 1 - this.showLabelsAtFactor, 0, 1);
  }

  /****************************************************************
   * POSITIONING
   ****************************************************************/

  /* 
   * Calculate the base for avatar locations based on window size
   * The svg element itself fills the window but the area used for
   * display should be a rectangle based on the smaller dimension
   * Called on window resize and when initialising
   */
  private _calcCoordinateFactors(): void {
    // TODO Take into account asymmetry of available width and height and compare that to the shape of the embedding space and scale accordingly

    const f = this._coordinateFactors;

    let diff = this.width - this.height;
    // If width > height
    if (diff > 0) {
      f.xOffset = diff / 2;
      f.yOffset = 0;
    } else {
      f.yOffset = diff / -2;
      f.xOffset = 0;
    }

    f.xOffset = f.xOffset * f.zoomScale + f.zoomXOffset;
    f.yOffset = f.yOffset * f.zoomScale + f.zoomYOffset;

    f.coordinateScale = this.coordinateScale * f.zoomScale;
    f.markerScale = clamp(f.zoomScale ** (1 / this._zoomMarkerScalingRoot), ...this._zoomMarkerScalingRange)
                    * this.markerScale;
    f.minimizedMarkerScale = this._getMinimizedCandidateScale();

    // The distance from one corner to the opposite in the projection scale
    // including possible margins caused by dragging the canvas outside the
    // container (_zoomTranslateExtentMargin).
    // This is used by _drawBackground()
    const aspectRatio = this.width / this.height;
    const translateMargin = this._zoomTranslateExtentMargin / this.coordinateScale;
    // One dimension has a projection distance of 1,
    // The other one is either bigger or smaller than that
    f.maxDistance = Math.sqrt(
      (translateMargin + 1) ** 2 +
      (translateMargin + (aspectRatio >= 1 ? aspectRatio : 1 / aspectRatio)) ** 2
    );
  }

  /*
   * Get a marker's x position on canvas
   */
  public convertX(x: number): number {
    return (x * (1 - 2 * this._coordinateFactors.marginFraction) + this._coordinateFactors.marginFraction) * this._coordinateFactors.coordinateScale + this._coordinateFactors.xOffset;
  }

  /*
   * Get a marker's y position on canvas
   */
  public convertY(y: number): number {
    return (y * (1 - 2 * this._coordinateFactors.marginFraction) + this._coordinateFactors.marginFraction) * this._coordinateFactors.coordinateScale + this._coordinateFactors.yOffset;
  }

  /*
   * Get the calculated scale for minimized candidate markers
   */
  private _getMinimizedCandidateScale(): number {
    // We use a modified _zoomMarkerScalingRoot for expansion here so that the scaling
    // goes from minimizedCandidateScale to 1 when the zoom level is between 1 and 
    // 2**(_zoomMarkerScalingRoot/1.25)
    // NB. If this is changed, be sure to update the inverse hereof below
    const m = this.minimizedCandidateScale;
    return m + (1 - m) * (clamp(this._coordinateFactors.zoomScale ** (1.25 / this._zoomMarkerScalingRoot), 1, 2) - 1);
  }

  /*
   * Get the zoomScale needed for a particular minimized marker scale
   */
  private _calcZoomScaleForMinimizedCandidateScale(scale: number): number | undefined {
    const m = this.minimizedCandidateScale;
    // These are incomputable
    if (m === 1 || m > scale || scale > 1)
      return undefined;
    // NB. This must be the inverse of the one above
    return ((scale - m) / (1 - m) + 1) ** (this._zoomMarkerScalingRoot / 1.25);
  }


  /****************************************************************
   * DRAWING CANVASES
   ****************************************************************/

  /*
   * Start redraw request
   */
  public redraw(): void {
    window.requestAnimationFrame(t => this.draw(t));
  }

  /*
   * Draw canvas and check if we are still animating and need to ask for another frame
   */
  public draw(time: DOMHighResTimeStamp = performance.now()): void {
    // Draw outside Angular to be safe 
    this.ngZone.runOutsideAngular(() => this._draw(time));
    // Check if we have running animations or a redraw flag set
    // and request a frame if there are any
    if (this._checkRedraw(time))
      this.redraw();
  }

  private _checkRedraw(time: DOMHighResTimeStamp = performance.now()): boolean {
    // Check if there's a flag and reset it
    const requested = this._requestRedrawFlag;
    this._requestRedrawFlag = false;
    // Check animations in any case, as this will also handle cleanup
    return this._checkAnimations(time) || requested;
  }

  private _checkAnimations(time: DOMHighResTimeStamp = performance.now()): boolean {
    // Remove completed
    this._animations.forEach(a => {
      if (a.isPast(time, true))
        this._animations.delete(a);
    });
    // Check if any are running
    return this._animations.size > 0;
  }

  /*
   * Do the actual drawing of the canvas
   */
  private _draw(time: DOMHighResTimeStamp): void {

    // Clear
    this._clearCanvases();

    // Draw bg map
    this._drawBackground();

    // Shorthands
    const ctx = this._context;
    const hit = this._hitContext;
    const scale = this._coordinateFactors.markerScale;

    // We'll collect the some of the items drawn here to possibly 
    // draw labels in front of them without having to iterate through 
    // all the markers for another time.
    const drawLabelsInFront: MapDatum[] = [];

    // Set stroke style
    // NB. For reasons to do with marker drawing option of opacity, 
    // strokeStyle is set per marker to this._bgColor when initialized
    ctx.lineWidth = this.markerOutlineWidth;
    ctx.lineJoin = "round";

    // Set hit stroke style to expand hit area
    hit.lineWidth = this._clickBleed * 2;
    hit.lineJoin = "round";

    // The drawing function
    // In order to avoid redundancy, there's a silly second argument
    const _drawMarker = (m: MapDatum, voterOnHitContext?: boolean) => {

      // We have to check for animations even if a marker is void, 
      // as it might be animating or transitioning to hidden = false
      if (!m.marker ||
         (m.marker.state === "void" && m.marker.transitionTo == null && !m.hasAnimations))
        return;

      // We want the voter drawn on the hit context behind the other markers 
      // so they can be clicked even if they overlap with this. We use the
      // excludeContexts argument of MapMarker.draw() to do this.
      let excludeContexts: boolean[];
      if (m instanceof MapDatumVoter)
        excludeContexts = voterOnHitContext ? [true, false] : [false, true];

      // Apply transformation
      m.marker.transformation = {
        translateX: this.convertX(m.x),
        translateY: this.convertY(m.y),
        scaleX: scale,
        scaleY: scale
      }

      // Apply possible animations
      // ApplyAnimations() returns true if the datum itself was changed
      // and those changes will only affect the next draw cycle
      this._requestRedrawFlag = m.applyAnimations(time);

      if (m.options.labelInFront) {
        // If the has labelInFront set and it's visible
        // add it to the que for drawing labels
        const visibleCtxs = m.marker.draw(true, false, excludeContexts);

        if (visibleCtxs[0])
          drawLabelsInFront.push(m);

      } else {
        // Otherwise, just draw the marker together with possible labels
        m.marker.draw(true, true, excludeContexts);
      }
    }

    // First, draw the voter marker on only the hit context
    if (this._voterDatum)
      _drawMarker(this._voterDatum, true);

    // Draw all other marker shapes. Without the second argument the
    // voter is only drawn on the visible context
    for (let m of this.markerData)
      _drawMarker(m);

    // Draw some labels in front
    drawLabelsInFront.forEach(m => m.marker.draw(false, true));
  }

  /*
   * Clear both the real and the hit canvas
   */
  private _clearCanvases(): void {
    this._context.clearRect(0, 0, this.width, this.height);
    this._hitContext.save();
    this._hitContext.fillStyle = "rgb(255, 255, 255)"; // This is used for bg clicks
    this._hitContext.fillRect(0, 0, this.width, this.height);
    this._hitContext.restore();
  }

  /*
   * Draw a stylized bg map centered on the map centre (proj. 0.5, 0.5 by default)
   * TODO: Only draw visible shapes
   */
  private _drawBackground(): void {

    if (this.backgroundType === 'none')
      return;

    const projCentre = this.mapCentre;
    const centre = {
      x: this.convertX(projCentre.x), 
      y: this.convertY(projCentre.y)
    };
    const nRadii = 12;
    // For the radar type, we only draw half of the radii
    const nRadiiToDraw = this.backgroundType === 'radar' ? Math.floor(nRadii / 2) + 1 : nRadii;
    const radLength = this._coordinateFactors.maxDistance / 2;
    const nCircles = 6;
    const circleArcAngle = this.backgroundType === 'radar' ? Math.PI : 2 * Math.PI;
    const scale = this._coordinateFactors.coordinateScale;
    const ctx = this._context;

    // Set style and start path
    ctx.save();
    ctx.strokeStyle = this.backgroundLineColor;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.setLineDash([0.1, 3]);
    ctx.beginPath();
    
    // Draw radii
    for (let i = 0; i < nRadiiToDraw; i++) {
      // The half pi offset is because of the radar type
      const angle = i * 2 * Math.PI / nRadii + 0.5 * Math.PI;
      const end = {
        x: this.convertX(projCentre.x + radLength * Math.sin(angle)),
        y: this.convertY(projCentre.y + radLength * Math.cos(angle))
      };

      ctx.moveTo(centre.x, centre.y);
      ctx.lineTo(end.x, end.y);
    }

    // Draw circles
    for (let i = 0; i < nCircles; i++) {
      const radius = (i + 1) * scale / 2 / nCircles;
      // We draw from circleArcAngle to zero because of the radar type
      ctx.moveTo(centre.x - radius, centre.y);
      ctx.arc(centre.x, centre.y, radius, circleArcAngle, 0);
    }

    // Stroke and restore
    ctx.stroke();
    ctx.restore();
  }


  /****************************************************************
   * ANIMATIONS
   ****************************************************************/

  /*
   * Animate a marker and register the animation.
   *
   * If a globalId is supplied a global animation is either created or
   * used if one exists by the same id. Be sure to include a timestamp 
   * or similar in the id to make it unique to the current run. This
   * is used for performance purposes when animating multiple markers
   * simultaneously.
   */
  private _animate(datum: MapDatum, properties: MapAnimationPropertiesDeep, 
    options: MapAnimationOptions = {}, globalId?: string): void {

    let animation: MapAnimationDeep;

    // If using global, check if one exists
    if (globalId !== undefined) {
      for (let a of this._animations) {
        if (a.id === globalId) {
          animation = a;
          break;
        }
      }
    }

    // Create animation if we didn't already get one
    if (animation == null) {
      animation = new MapAnimationDeep(
        properties,
        { duration: this.animationDuration,
          id: globalId,
          ...options
        }
      );
      this._registerAnimation(animation);
    }

    // Finally add the animation to the marker datum
    datum.addAnimation(animation);
  }

  private _registerAnimation(animation: MapAnimationDeep): void {
    this._animations.add(animation);
  }

  /****************************************************************
   * CLICKS
   ****************************************************************/

  /*
   * Try to locate clicked element by the color on the hit canvas
   * In order to avoid false clicks because of antialiasing, we also measure
   * the distance between the marker's centre and the click location.
   */
  public onCanvasClick(event: MouseEvent): void {

    console.log("onCanvasClick");

    if (this._canvasInitialized) {

      // Position on canvas
      const x = event.clientX - this._canvas.offsetLeft;
      const y = event.clientY - this._canvas.offsetTop;

      // If the zoom threshold is set, we zoom closer in addition 
      // to possibly eliciting a marker click
      if (this.zoomOnClickThreshold != null && 
          this._coordinateFactors.minimizedMarkerScale < this.zoomOnClickThreshold) {
        
        // The zoom level at the threshold
        let zoomLevel = this._calcZoomScaleForMinimizedCandidateScale(this.zoomOnClickThreshold);

        // If this is computable, don't do anything
        if (zoomLevel) {
          // However, if we are zooming, we want there to be at least a 0.5 factor change
          zoomLevel = Math.max(zoomLevel, this._coordinateFactors.zoomScale + 0.5);
          this._zoomTo(x, y, zoomLevel);
        }
      }

      // Pixel color on hit canvas
      const rgba = this._hitContext.getImageData(x * this._pixelRatio, y * this._pixelRatio, 1, 1).data;

      // Use as key to get datum from dict
      const key = rgba.slice(0, 3).join(",");
      const datum = this._hitColor2Marker?.[key];

      // console.log("Click", x, y, key, datum?.source?.id, JSON.parse(JSON.stringify(datum ?? "NODATUM")), 
      //   this._hitColor2Marker, this.markerData, this._animations,
      //   `minScale ${this._coordinateFactors.minimizedMarkerScale} based on Input ${this.minimizedCandidateScale}.`,
      //   `zoomLevel ${this._coordinateFactors.zoomScale} maxZoom ${this.zoomExtents[1]} labelOpacity ${this.globalLabelOpacity} opacityThreshold ${this.showLabelsAtFactor}`,);
      
      // Ensure that click is within the bounding box of the marker and
      // emit matching click
      if (datum && datum.marker.isInside(x, y, this._hitContext, 5))
        return this._emitMarkerClick(datum, x, y);
    }

    // If there was not appropriate match, emit bg click
    this.onBgClick.emit();
  }

  private _emitMarkerClick(datum: MapDatum, x: number, y: number): void {
    this.onMarkerClick.emit({datum: datum, x, y});
  }

  /****************************************************************
   * OTHER INTERACTIONS
   ****************************************************************/

  /*
   * Called by the zoomEmitter and onCanvasClick
   * The x and y coordinates are the desired centre coordinates in 1:1 scale
   */
  private _zoomTo(x: number, y: number, toScale: number = this._coordinateFactors.zoomScale): void {

    if (!this._zoomElement)
      return;

    let tX = -1 * (x * toScale - this.width / 2),
        tY = -1 * (y * toScale - this.height / 2);

    this._zoomElement
      .transition()
      .duration(this.zoomDuration)
      .call(this._zoomFunction.transform, this.d3.getTransform(toScale, tX, tY));
  }
}