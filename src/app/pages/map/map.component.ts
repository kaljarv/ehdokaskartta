import { Component, 
         HostBinding,
         OnInit, 
         ViewChild, 
         ElementRef,
         EventEmitter,
         OnDestroy } from '@angular/core';
import { ActivatedRoute,
         Router } from '@angular/router';
import { trigger,
         style,
         animate,
         transition,
         query,
         animateChild } from '@angular/animations';
import { Subscription } from 'rxjs';
  
import { MatTooltip } from '@angular/material/tooltip';

import { MatcherService, 
         Candidate,
         SharedService, 
         PATHS,
         D3Service } from '../../core';

import { AvatarState,
         AVATAR_DIMENSIONS } from './avatars/person-avatar.component';



const ANIMATION_STAGGER_TIMING: string = "225ms {{animationDelay}}ms cubic-bezier(0.4, 0, 0.2, 1)";
const ANIMATION_STATIC_TIMING: string = "225ms cubic-bezier(0.4, 0, 0.2, 1)";
const ANIMATION_MAX_STAGGER: number = 225 * 2; // The maximum stagger delay for ANIMATION_STAGGER_TIMING
const ZOOM_DURATION = 500; // Zoom transition duration in ms
const SHOW_INFOS_DELAY = 100; // A small delay after the map has loaded before showing the infos, needed for the components to initialise
const HIDE_TOOLTIPS_DELAY = 225;


/*
 * Different map item types
 */

export type MapPlaceableType = 'voter' | 'party' | 'candidate';

/*
 * Interface for avatars placeable on the map
 * This is not very elegant, should be refactored
 * At the same time Candidate should probably be converted from an interface to
 * a class.
 */

export interface MapPlaceable {
  id?: string;
  type?: MapPlaceableType;
  filteredOut?: any;
  tsne1?: number;
  tsne2?: number;
  x?: number; // Proportional location [0,1] after dispersal
  y?: number;
}


/*
 * Values for calculating map positions including zoom
 */

export interface MapPositionBase {
  scale: number;
  xOffset: number;
  yOffset: number;
  zoomScale: number;
  zoomXOffset: number;
  zoomYOffset: number;
  marginFraction: number; 
}

/*
 * <app-map>
 */
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass'],
  host: {
    '(window:resize)': 'onWindowResize()'
  },
  animations: [
    trigger('textAppear', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(ANIMATION_STAGGER_TIMING, style({
          opacity: 1,
        }))],
        {params: {
          animationDelay: 0,
      }}),
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(ANIMATION_STATIC_TIMING, style({
          opacity: 0,
        }))
      ]),
    ]),
    // We need this because the :leave animation is defined within the PartyAvatar component
    trigger('partyLeave', [
      transition(':enter, :leave', [
        query('@*', animateChild())
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(ANIMATION_STATIC_TIMING, style({
          opacity: 1,
        })),
      ]),
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(ANIMATION_STATIC_TIMING, style({
          opacity: 0,
        })),
      ]),
    ]),
  ],
})
export class MapComponent implements OnInit, OnDestroy {
  /*
   * Bind height to window innerHeight instead of setting it to 100vh which doesn't work as wanted on mobile
   */
  @HostBinding('style.height.px')
  get height(): number {
    return window.innerHeight;
  }
  @ViewChild('map') mapSvg: ElementRef;
  @ViewChild('mapZoomContainer') mapZoomContainer: ElementRef;
  @ViewChild('voterTooltip') voterTooltip: MatTooltip;
  public candidates = new Array<MapPlaceable>();
  public parties = new Array<MapPlaceable>();
  public avatars = new Array<MapPlaceable>(); // We'll conflate candidates and parties in this list for correct depth placement
  public voter: MapPlaceable; // We'll save the voter here
  public zoomScaleExtent: number[] = [0.8, 15]; // TODO Change to dynamically calculated one based on dims
  // How much further (on zoom level 1 dimensions) than the window size to allow zooming
  // TODO: Change to a dynamically calculated one
  public zoomTranslateExtentMargin: number = 250; 
  public zoomElement: any; // Will contain a d3 selection for the zoomable element
  public zoomFunction: any; // d3 zoom behaviour
  public windowResizeDelay: number = 500; // Call rescale after this delay for window resize (and supress further calls during that time)
  private _windowResizeLock: boolean = false; // Used to track the above delay rescaling
  public showLabelsAtFactor: number = 24000; // The min dimension factor to show labels at, set lower to show them sooner
  // public labelMargin = 50; // The min distance from screen edge for avatars to show labels for
  public avatarScale: number = 0.9; // Global scaling for avatars of all types
  public scaleRoot: number = 4; // The nth root of zoomScale which is used to scale the avatar 
  public progressValueEmitter: EventEmitter<number>;
  public isLoading: boolean = true;
  public showAllParties: boolean = false;
  public toolTipClassBase: string = "map-tooltip";
  // These are global values for avatar placement
  // They are calculated based on zoom and window size
  public posBase: MapPositionBase = {
    scale: 1,
    xOffset: 0, // Global offset
    yOffset: 0,
    zoomScale: 1,
    zoomXOffset: 0,
    zoomYOffset: 0,
    marginFraction: 0.02 // Margin as fraction of total dim
  };
  // The multiplier applied to marker radius when setting dispersal radius for clustered markers.
  // If this is lower than 1 it means the user has to zoom in before all clusters are dispersed.
  // If set too high it will result in too dispersed a view, especially on smaller screens.
  public dispersalRadiusMultiplier: number = 0.5;
  // A further multiplier in effect for the area cleared behind the voter avatar
  public voterDispersalMultiplier: number = 0.6;
  // For the collide simulation, doesn't need to be very high
  public dispersalMaxIterations: number = 10;
  public d3: any; // Shortcut to D3Service.d3
  // Track first interaction
  private _userHasInteracted: boolean = false;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  constructor(
    private matcher: MatcherService,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private d3s: D3Service,
  ) { 
    this.progressValueEmitter = this.matcher.progressChanged;
    this.d3 = this.d3s.d3;

    // Check if we are browsing or not
    if (this.route.snapshot.data.voterDisabled) {
      this.matcher.voterDisabled = true;
    } else {
      this.matcher.voterDisabled = false;
    }
  }

  get voterDisabled(): boolean {
    return this.matcher.voterDisabled;
  }

  ngOnInit() {
    // Topbar
    this.shared.title = this.voterDisabled ?
                        "Ehdokkaat" : // `${this.matcher.constituency}n ehdokkaat` : // NB. In order for this to work properly, we should do it in a subscription
                        "Tulokset";
    this.shared.subtitle = (this.voterDisabled ?
                           "Ehdokkaat on sijoiteltu kartalle heidän mielipiteidensä perusteella." :
                           "Ehdokkaat on sijoiteltu kartalle sen perusteella, mitä he ovat vastanneet valitsemiisi kysymyksiin, ja kartan keskeltä löydät itsesi."
                           ) + " Voit lähentää tai loitontaa karttaa, rajata ehdokkaita vaikkapa iän perusteella tai näyttää puolueet kartalla.";
    
    // Initialisation chain
    this._subscriptions.push(this.matcher.tsneDataReady.subscribe(() => this.initMap()));
    this._subscriptions.push(this.matcher.candidateDataReady.subscribe(() => this.initData()));
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => {
      // Make sure the constituency is defined, as if not, candidateDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));

    // Map tools
    this._subscriptions.push(this.shared.locateSelf.subscribe(() => this.locateSelf()));
    this._subscriptions.push(this.shared.toggleAllParties.subscribe(() => this.shared.showAllParties = !this.shared.showAllParties));
    
    // We need to keep an eye on the party filters
    // 1. We don't want to show all parties if a party filter is active only the ones filtered in
    // 2. If the active candidate would be filtered out, we'll hide them
    this._subscriptions.push(
      this.matcher.filterDataUpdated.subscribe(() => {
        if (this.partyFiltersActive)
          this.shared.showAllParties = false;
        if (this.shared.activeCandidateId && this.matcher.getCandidate(this.shared.activeCandidateId).filteredOut)
          this.hideCandidate();
      })
    );

    // Subscribe to all interactions to hide infos on first interaction
    this._subscriptions.push(this.shared.mapInteraction.subscribe(() => this.hideInfos()));
  }

  ngOnDestroy() {
    this.shared.showMapTools = false;
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  public showInfos(): void {
    this.shared.showMapTooltips.emit();
    if (this.voterTooltip != null)
      this.voterTooltip.show();
  }

  public hideInfos(): void {
    if (!this._userHasInteracted) {
      this._userHasInteracted = true;
      this.shared.minimiseTopBar.emit();
      this.shared.hideMapTooltips.emit();
      if (this.voterTooltip != null)
        this.voterTooltip.hide(HIDE_TOOLTIPS_DELAY);
    }
  }

  public initData(): void {
    if (!this.matcher.hasEnoughAnswersForTsne && 
        !this.voterDisabled) {
      this.router.navigate([PATHS.questions]);
      return;
    }
    // If this.voterDisabled is true, initTsne will use all questions, 
    // not the ones we have voter answers for
    this.matcher.initTsne();
  }

  public initMap(): void {

    // Get candidates
    this.candidates = this.matcher.getCandidatesAsList();
    this.candidates.forEach( c => c.type = 'candidate' );

    // Create the Voter, a pseudo-Candidate object
    // It will be sorted with the rest of the avatars
    if (!this.voterDisabled) {
      this.voter = {
        type: 'voter',
        filteredOut: false,
        tsne1: 0.5,
        tsne2: 0.5,
      };
      this.voter.x = this.voter.tsne1;
      this.voter.y = this.voter.tsne2;
    }

    // Get party centroids
    this.parties = this.matcher.getPartiesAsList();

    // Set MapPlaceableType for them
    // as well as x and y coordinates as the parties only have tsne1/2 set
    this.parties.forEach( p => {
      p.type = 'party';
      p.x = p.tsne1;
      p.y = p.tsne2;
    });

    // This is async so we need to wait
    this.rescaleMap().then(() => {
      // Init view and hide spinner
      this.isLoading = false;

      // This will show the filtering tools
      this.shared.showMapTools = true;

      // Show tooltips and other infos for onboarding
      setTimeout( () => this.showInfos(), SHOW_INFOS_DELAY);
    });

  }

  /*
   * Handle operations needed when the map dimensions change 
   * (or are initially set)
   */
  public async rescaleMap(): Promise<void> {

    return new Promise<void>( resolve => {
      // Calc positioning base values based on window size
      this.calcPositionBase();
      
      // Disperse clustered candidates
      // This is async so we need to wait
      this.disperseAvatars().then( () => {

        // Sort candidates to get them on the right 'z-index'
        this.sortAvatars();

        // Set the zoom extents based on window size
        this.setupZoomability();

        // Ready
        resolve();
      });
    });

  }

  /*
   * On window resize, call rescaleMap while preventing multiple calls
   */
  public onWindowResize(): void {

    // If a call hasn't already been made
    if (!this._windowResizeLock) {

      // Lock resizing for the delay
      this._windowResizeLock = true;

      setTimeout(() => {

        // Save the current dimensions, so that we can check after the async operation
        // if they've been changed meanwhile
        const dimensions = [window.innerWidth, window.innerHeight];

        // Perform rescaling and then...
        this.rescaleMap().then(() => {

          // ...release lock
          this._windowResizeLock = false;

          // But if the window size was changed while we were busy, start over
          if (dimensions[0] !== window.innerWidth ||  dimensions[1] !== window.innerHeight)
            this.onWindowResize();
          
          // Center the zoom as it's otherwise disorientating
          this.zoomElement.transition().duration(ZOOM_DURATION).call(
            this.zoomFunction.translateTo,
            dimensions[0] / 2, dimensions[1] / 2
          );
        });

      }, this.windowResizeDelay);
    }
    
  }


  /* 
   * Calculate the base for avatar locations based on window size
   * The svg element itself fills the window but the area used for
   * display should be a rectangle based on the smaller dimension
   * Called on window resize and when initialising (with the arg true)
   */
  public calcPositionBase(isInitSequence: boolean = false): void {

    // TODO Take into account asymmetry of available width and height and compare that to the shape of the embedding space and scale accordingly
    let diff =  window.innerWidth - window.innerHeight;
    // If width > height
    if (diff > 0) {
      this.posBase.scale = window.innerHeight;
      this.posBase.xOffset = diff / 2;
      this.posBase.yOffset = 0;
    } else {
      this.posBase.scale = window.innerWidth;
      this.posBase.yOffset = diff / -2;
      this.posBase.xOffset = 0;
    }
    this.posBase.scale *= this.posBase.zoomScale;
    this.posBase.xOffset = this.posBase.xOffset * this.posBase.zoomScale + this.posBase.zoomXOffset;
    this.posBase.yOffset = this.posBase.yOffset * this.posBase.zoomScale + this.posBase.zoomYOffset;

  }

  /*
   * Disperse candidates clustered too close together
   * or behind the Voter avatar.
   * This is async as it used d3.forceSimulation
   */
  public async disperseAvatars(): Promise<void> {

    return new Promise<void>( resolve => {
      
      // Dispersal offset
      const offsetRadius: number = this.dispersalRadiusMultiplier * this.avatarScale * AVATAR_DIMENSIONS.headR;

      // We need to save the current scale, because the window size might change while we are running the simulation
      const scale: number = this.posBase.scale;

      // We'll catch the (possible) voter avatar's position here
      let voterPos: any;

      // Create a copy of the candidates plus the possible voter for dispersal
      const avatars: MapPlaceable[] = this.voterDisabled ? 
                                      this.candidates : 
                                      this.candidates.concat([this.voter]);
      const nodes: any[] = avatars.map(a => {

        // Scale the tsne values, as handing out values in the [0,1] range to the d3 simulation
        // doesn't work well
        const x = a.tsne1 * scale;
        const y = a.tsne2 * scale;

        // NB. The voter will not be included in the candidates array if this.voterDisabled == true
        if (a.type === 'voter') {
          // If the avatar is the voter, save coords and return node with fixed coordinates
          voterPos = { x, y };
          return { fx: x, fy: y };
        } else {
          return { x, y };
        }

      });

      // Add a rectangle of further fixed nodes to disperse markers from behind the voter avatar
      // TODO: Convert to circle and responsive to zoom
      if (!this.voterDisabled) {
        const radStep = 1.5; // 2 would space these evenly but we want them to overlap a bit to ensure no markers stay within
        const offsetY = 0.1; // Extend the are by this fraction below the avatar
        const areaWidth = AVATAR_DIMENSIONS.width * this.avatarScale * this.dispersalRadiusMultiplier * this.voterDispersalMultiplier;
        const areaHeight = AVATAR_DIMENSIONS.height * this.avatarScale * this.dispersalRadiusMultiplier * this.voterDispersalMultiplier;
        const stepsX = Math.ceil(areaWidth / (radStep * offsetRadius));
        const stepsY = Math.ceil(areaHeight / (radStep * offsetRadius));
        for (let x = 0; x <= stepsX; x++) {
          for (let y = 0; y <= stepsY; y++) {
            // Calculate positions
            nodes.push({
              fx: voterPos.x + x * areaWidth / stepsX  - areaWidth / 2, // voterPos.x is the center
              fy: voterPos.y - y * areaHeight * (1 + offsetY) / stepsY + areaHeight * offsetY,
            });
          }
        }
      }

      // Run dispersal force simulation
      const simulation = this.d3.forceSimulation(nodes)
        .force("disperse",
          this.d3.forceCollide()
            .radius(offsetRadius)
            .strength(0.7)
            .iterations(this.dispersalMaxIterations)
          );

      // Call this when simulation is ready
      const onSimulationReady = () => {

        // If we reached manually set max iterations
        simulation.stop();

        // Apply revised values to candidates' x and y properties
        // Note that as we only run to candidates.length, we'll automatically skip the voter avatar rect nodes
        for (let i = 0; i < this.candidates.length; i++) {
          // We must rescale the values back to the proportional range of [0,1]
          // NB. We don't edit the tsne values themselves as this would mess up things when
          // the window is rescaled
          this.candidates[i].x = nodes[i].x / scale;
          this.candidates[i].y = nodes[i].y / scale;
        }

        // Ready
        resolve();
      }

      // Force ending a bit sooner
      let iter = 0;
      simulation.on("tick", () => {
        if (++iter === this.dispersalMaxIterations)
          onSimulationReady();
      });

      // If it ends on it's own account
      simulation.on("end", onSimulationReady);

    });

  }

  /*
   * Sorts all avatars based on tsne coordinates so they line up nicely depth-wise
   */
  public sortAvatars(): void {

    // Conflate avatars: candidates, parties and the possible voter
    this.avatars = this.candidates.concat(this.parties);
    if (!this.voterDisabled) {
      this.avatars.push(this.voter);
    }
    // Sort based on y axis
    this.avatars.sort( (a, b) => a.y - b.y );

  }

  private setupZoomability(): void {

    this.zoomElement = this.d3.select(this.mapSvg.nativeElement);

    const zoomed = () => {
      this.hideInfos();
      const transform = this.d3.event.transform;
      this.posBase.zoomScale = transform.k;
      this.posBase.zoomXOffset = transform.x;
      this.posBase.zoomYOffset = transform.y;
      this.calcPositionBase();
    };

    this.zoomFunction = this.d3.zoom()
      .on("zoom", zoomed)
      .clickDistance(10)
      .scaleExtent(this.zoomScaleExtent)
      .translateExtent([
        [-this.zoomTranslateExtentMargin, -this.zoomTranslateExtentMargin],
        [window.innerWidth + this.zoomTranslateExtentMargin, window.innerHeight + this.zoomTranslateExtentMargin]
      ]);
    // We'll set the translate extent in the rescale method

    this.zoomElement.call(this.zoomFunction);
  }

  /*
  private setZoomTranslateExtent(): void {
    // 
    let zoom = this.zoomElement.on(".zoom");
    zoom.translateExtent([
      [-this.zoomTranslateExtentMargin, -this.zoomTranslateExtentMargin],
      [window.innerWidth + this.zoomTranslateExtentMargin, window.innerHeight + this.zoomTranslateExtentMargin]
    ]);
    this.zoomElement.call(zoom);
  }
  */

  get filteredInAvatars(): Array<MapPlaceable> {
    return this.avatars.filter(c => !this.getFilteredOut(c));
  }
  get filteredOutAvatars(): Array<MapPlaceable> {
    return this.avatars.filter(c => this.getFilteredOut(c));
  }

  public toggleCandidate(candidate: Candidate, event: MouseEvent): void {
    this.shared.toggleCandidate.emit(candidate.id);
    // Stop propagation which would otherwise reach the map svg element
    // whose click listener will close the candidate details
    event.stopPropagation();
  }

  // Called when the map backgound is clicked
  public hideCandidate(): void {
    this.shared.hideCandidate.emit();
  }

  /*
   * Avatar property getters
   */

  public getX(item: MapPlaceable): number {
    return (('x' in item ? item.x : item.tsne1) * (1 - 2 * this.posBase.marginFraction) + this.posBase.marginFraction) * this.posBase.scale + this.posBase.xOffset;
  }

  public getY(item: MapPlaceable): number {
    return (('y' in item ? item.y : item.tsne2) * (1 - 2 * this.posBase.marginFraction) + this.posBase.marginFraction) * this.posBase.scale + this.posBase.yOffset;
  }

  public getScale(): number {
    return (this.posBase.zoomScale > 1 ? this.posBase.zoomScale ** (1 / this.scaleRoot) : 1) * (this.avatarScale == null ? 1 : this.avatarScale);
  }

  public getFilteredOut(item: MapPlaceable): boolean {
    return item.filteredOut ? true : false;
  }

  public getTooltip(candidate: Candidate): string {
    return `${candidate.givenName}\xa0${candidate.surname}, ${candidate.party}`;
  }

  public getAvatarState(candidate: MapPlaceable): AvatarState {
    if (!candidate.filteredOut && this.shared.activeCandidateId === candidate.id) {
      return 'active';
    } else {
      return 'default';
    }
  }

  /*
   * Labels
   */

  public showLabels(): boolean {
    return this.showLabelsAtFactor < (this.posBase.zoomScale * this.posBase.scale) / (this.dispersalRadiusMultiplier * this.avatarScale * AVATAR_DIMENSIONS.headR) ? true : false;
  }

  /*
  // Show label only if avatar is in view
  public showLabelFor(candidate: MapPlaceable): boolean {
    return !candidate.filteredOut &&
           !candidate.isVoter &&
           this.isInView(candidate);
  }


  public isInView(candidate: MapPlaceable): boolean {
    // return true;
    const x = this.getX(candidate);
    const y = this.getY(candidate);
    return x > this.labelMargin &&
           y > this.labelMargin &&
           x < window.innerWidth - this.labelMargin && 
           y < window.innerHeight - this.labelMargin;
  }
  */

  /*
   * Offset for text based on the head marker size
   * NB. Doesn't take into account line height, which should be accounted
   * for in the sass file
   */
  public textOffset(): number {
    return AVATAR_DIMENSIONS.headR * this.getScale();
  }

  /*
   * Return params suitable for ANIMATION_STAGGER_TIMING for use when new 
   * text labels appear
   */
  public getTextAppearStagger(): any {
    return {
      value: undefined, // Needed for the params to take effect
      params: {
        animationDelay: Math.round(Math.random() * ANIMATION_MAX_STAGGER),
      }
    }
  }

  public showPartyAvatar(party: string): boolean {
    return  this.shared.showAllParties || 
           (!this.matcher.partyIsExcluded(party) &&
            this.shared.activeCandidateId != null && 
            party == this.matcher.getCandidate(this.shared.activeCandidateId).party) ||
            this.matcher.partyIsRequired(party);
  }

  /*
   * Center map (on voter)
   */
  public locateSelf(): void {
    this.zoomElement.transition().duration(ZOOM_DURATION).call(
      this.zoomFunction.translateTo,
      window.innerWidth  * (this.voterDisabled ? 0.5 : this.voter.x),
      window.innerHeight * (this.voterDisabled ? 0.5 : this.voter.y),
    );
  }

  public goToQuestions(): void {
    this.router.navigate([PATHS.questions]);
  }

  public showFavourites(): void {
    this.shared.showFavourites.emit();
  }

  public setPartyFilter(party: string = null, exclude: boolean = false): void {
    this.matcher.setPartyFilter(party, exclude);
    this.shared.logEvent('map_party_filter_set', {party, exclude});
  }

  get partyFiltersActive(): boolean {
    return this.matcher.hasPartyFilter;
  }

  public isOnlyActivePartyFilter(party: string): boolean {
    // True at the end requires the party be the only active
    return this.matcher.partyIsRequired(party, true);
  }

}