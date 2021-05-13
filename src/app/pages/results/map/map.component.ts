import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { 
  combineLatest,
  Subscription 
} from 'rxjs';
import { 
  filter,
  first 
} from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import {
  AbbreviatePipe,
  Candidate,
  GenitivePipe,
  D3Service,
  MatcherService,
  Party,
  ProjectionMethod,
  SharedService,
  ToClassNamePipe,
  ANIMATION_DURATION_MS,
  PATHS
} from '../../../core';
import { 
  MapBackgroundType,
  MapDatum,
  MapDatumCandidate,
  MapDatumParty,
  MapDatumVoter,
  MapEnsureVisibleOptions,
  MapMarkerClickData,
  MapRedrawOptions,
  OnboardingTourComponent, 
  ZoomProperties,
  MAP_MARKER_CANDIDATE_HEAD_RADIUS
} from '../../../components';


const PARTY_SELECTOR_PREFIX = "party-";
const PARTY_COLOR_PROPERTY = "fill";

type ColorDict = { [party: string]: string };

/*
* <app-map>
*/
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass'],
  // host: {
  //   '(window:resize)': 'onWindowResize()'
  // },
})
export class MapComponent 
  implements AfterViewInit, OnInit, OnDestroy {
  /*
   * See matcher for projection methods
   */
  @Input() projectionType: ProjectionMethod = 'RadarPCA';

  /*
   * This should match $color-primary in the sass definitions
   */
  @Input() voterColor: string = "rgba(0,0,0,0.87)";

  /*
   * Bind height to window innerHeight instead of setting it to 100vh which doesn't work as wanted on mobile
   */
  @HostBinding('style.height.px')
  get height(): number {
    return window.innerHeight;
  }
  get width(): number {
    return window.innerWidth;
  }

  @ViewChild(OnboardingTourComponent)
  onboardingTour: OnboardingTourComponent;

  @ViewChild('partyMenuTrigger', {read: MatMenuTrigger}) 
  partyMenuTrigger: MatMenuTrigger;

  @ViewChild('voterMenuTrigger', {read: MatMenuTrigger}) 
  voterMenuTrigger: MatMenuTrigger;

  @ViewChild('voterTooltip') 
  voterTooltip: MatTooltip;


  public colors: ColorDict = {}; // We fetch colors for parties from the stylesheets and store it here
  public candidates = new Array<Candidate>();
  public ensureVisibleEmitter: EventEmitter<MapEnsureVisibleOptions>;
  public parties = new Array<Party>();
  // We might change this based on the voter position
  public mapCentre = {x: 0.5, y: 0.5};
  public markerData = new Array<MapDatum>(); // We'll conflate candidates and parties in this list for correct depth placement
  public coordinateScale = 1.0;
  public markerScale = 1.0;
  public minimisedCandidateScale = 1.0;
  public zoomExtents = [0.8, 15];
  public showLabelFactor = 0.8 * 8;
  public voter: any; // We'll save the voter here

  // These are used to control mat-menus dynamically
  // NB. Due to a bug, the data item is not passed to the menu but
  // read explicitly when needed
  public partyMenuTriggerProperties: {
    x: string, y: string, data?: any
  } = {
    x: "-1000px", y: "-1000px",
    data: { 
      party: null 
    }
  }
  public voterMenuTriggerProperties: {
    x: string, y: string,
  } = {
    x: "-1000px", y: "-1000px"
  }

  public windowResizeDelay: number = 500; // Call rescale after this delay for window resize (and supress further calls during that time)
  public redrawEmitter = new EventEmitter<MapRedrawOptions>();
  public zoomEmitter = new EventEmitter<ZoomProperties>();
  public showAllParties: boolean = false;
  public toolTipClassBase: string = "map-tooltip";
  // The multiplier applied to marker radius when setting dispersal radius for clustered markers.
  // If this is lower than 1 it means the user has to zoom in before all clusters are dispersed.
  // If set too high it will result in too dispersed a view, especially on smaller screens.
  public dispersalRadiusMultiplier: number = 0.35;
  public dispersalMaxIterations: number = 10; // For the collide simulation, doesn't need to be very high
  public dispersalMaxDuration: DOMHighResTimeStamp = 4000;
  public dispersalAlphaMin: number = 0.35;
  public d3: any; // Shortcut to D3Service.d3

  // Used by rescale
  private _mapInitialized: boolean = false;
  // Track first interaction
  private _userHasInteracted: boolean = false;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Fire on afterViewInit
  private _viewInitialized = new EventEmitter<boolean>();


  constructor(
    private matcher: MatcherService,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private d3s: D3Service,
    private toClassName: ToClassNamePipe,
    private abbreviate: AbbreviatePipe,
    private genitive: GenitivePipe
  ) {

    // Check if we are browsing or not
    if (this.route.snapshot.data.voterDisabled)
      this.matcher.voterDisabled = true;
    else
      this.matcher.voterDisabled = false;

    this.shared.reportPageOpen({
      currentPage: this.voterDisabled ? 'browse' : 'map',
      subtitle: (this.voterDisabled ?
                  "Ehdokkaat on sijoiteltu kartalle heidän mielipiteidensä perusteella." :
                  "Ehdokkaat on sijoiteltu kartalle sen perusteella, mitä he ovat vastanneet valitsemiisi kysymyksiin, ja kartan keskeltä löydät itsesi."
                ) + " Voit lähentää tai loitontaa karttaa, rajata ehdokkaita vaikkapa iän perusteella tai näyttää puolueet kartalla.",
      onboarding: {restart: () => this.onboardingTour?.restart()},
      // NB. We'll only show these when we've initialised
      // showMapTools: true,
      loadingState: {
        type: 'loading',
        message: 'Ladataan tuloksia…',
      }
    });

    this.d3 = this.d3s.d3;

    // Route the events directly from shared
    this.ensureVisibleEmitter = this.shared.ensureVisibleOnMap;

    // Start loading spinner
    this._reportProgress();
  }

  get isRadar(): boolean {
    return this.projectionType.indexOf('Radar') === 0;
  }

  get mapBackgroundType(): MapBackgroundType {
    return this.isRadar ? 'radar' : 'default';
  }

  get usePortrait(): boolean {
    return this.shared.usePortrait;
  }

  get voterDisabled(): boolean {
    return this.matcher.voterDisabled;
  }

  ngOnInit() {

    // Initialisation chain
    this._subscriptions.push(this.matcher.progressChanged.subscribe(v => this._reportProgress(v)))
    this._subscriptions.push(this.matcher.mappingDataReady.subscribe(() => this.initMap()));
    this._subscriptions.push(this.matcher.candidateDataReady.subscribe(() => this.initData()));
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => {
      // Make sure the constituency is defined, as if not, candidateDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));

    // Onboarding
    // Show only after data is loaded and the view is initialized
    // First() will unsubscribe itself
    combineLatest([this.shared.loadingState, this._viewInitialized]).pipe(
      filter(([ls, _]) => ls.type === 'loaded'),
      first()
    ).subscribe(() => {
      if (this.onboardingTour && !this.onboardingTour.active)
        this.onboardingTour.start();
    });

    // Map tools
    this._subscriptions.push(this.shared.locateSelf.subscribe(() => this.locateSelf()));
    this._subscriptions.push(this.shared.toggleAllParties.subscribe(() => {
      this.shared.showAllParties = !this.shared.showAllParties;
      this.updateMapMarkerData(MapRedrawOptions.RedrawOnly);
    }));

    // We need to keep an eye on the party filters
    // 1. We don't want to show all parties if a party filter is active only the ones filtered in
    // 2. If the active candidate would be filtered out, we'll hide them
    this._subscriptions.push(
      this.matcher.filterDataUpdated.subscribe(() => {
        if (this.partyFiltersActive)
          this.shared.showAllParties = false;
        if (this.shared.activeCandidateId && this.matcher.getCandidate(this.shared.activeCandidateId).filteredOut)
          this.hideCandidate();
        this.updateMapMarkerData(MapRedrawOptions.ReSort);
      })
    );

    // Subscribe to changes in the active candidate to signal map canvas
    this._subscriptions.push(this.shared.activeCandidateChanged.subscribe(() => 
      this.updateMapMarkerData(MapRedrawOptions.RedrawOnly)
    ));

    // Subscribe to changes in favourites
    this._subscriptions.push(this.matcher.favouritesDataUpdated.subscribe(() => 
      this.updateMapMarkerData(MapRedrawOptions.RedrawOnly)
    ));
    
    // Subscribe to all interactions to hide infos on first interaction
    this._subscriptions.push(this.shared.mapInteraction.subscribe(() => this.hideInfos()));
  }

  ngAfterViewInit() {
    // See sub in ngOnInit
    this._viewInitialized.emit(true);
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;
      
    this.onboardingTour = null;
    this.partyMenuTrigger = null;
    this.voterMenuTrigger = null;
    this.voterTooltip = null;
    this.colors = null;
    this.candidates = null;
    this.ensureVisibleEmitter = null;
    this.parties = null;
    this.markerData?.forEach(m => m.dispose());
    this.markerData = null;
    this.voter = null;
    this.partyMenuTriggerProperties = null;
    this.voterMenuTriggerProperties = null;
    this.redrawEmitter = null;
    this.zoomEmitter = null;
    this.d3 = null;
    this._viewInitialized = null;
  }

  // public showInfos(): void {
  //   this.shared.showMapTooltips.emit();
  //   if (this.voterTooltip != null)
  //     this.voterTooltip.show();
  // }

  public hideInfos(): void {
    if (!this._userHasInteracted) {
      this._userHasInteracted = true;
      this.shared.minimiseTopBar.emit();
      // this.shared.hideMapTooltips.emit();
      // if (this.voterTooltip != null)
      //   this.voterTooltip.hide(HIDE_TOOLTIPS_DELAY);
    }
  }

  public initData(): void {
    if (!this.matcher.hasEnoughAnswersForMapping &&
      !this.voterDisabled) {
      this.router.navigate([PATHS.questions]);
      return;
    }
    // If this.voterDisabled is true, initMapping will use all questions, 
    // not the ones we have voter answers for
    this.matcher.initMapping();
  }

  public initMap(): void {

    // Get candidates
    this.candidates = this.matcher.getCandidatesAsList();

    // Set map centre
    this.mapCentre = {
      x: this.isRadar ? this.matcher.radarCentre[0] : 0.5,
      y: this.isRadar ? this.matcher.radarCentre[1] : 0.5
    };

    // Create the Voter, a pseudo-Candidate object
    // It will be sorted with the rest of the avatars
    if (!this.voterDisabled) {
      this.voter = {
        isVoter: true,
        filteredOut: false,
        projX: this.mapCentre.x,
        projY: this.mapCentre.y
      };
    }
      
    // Get party centroids
    this.parties = this.matcher.getPartiesAsList();

    // Scale zoom extents and marker scale based on the sqrt of the 
    // number of candidates. The scaling factor runs from 0 to 1
    // starting from 100 candidates and ending at 1000. In the 2017
    // Finnish municipal elections, the largest number of candidates
    // in a municipality was 1084.
    let f = (Math.sqrt(this.candidates.length) - Math.sqrt(100)) / Math.sqrt(900);
        f = this.shared.clamp(f, 0, 1);
    // Nb. this runs from 0.4 to 0.8
    this.minimisedCandidateScale = 0.5 + (1 - f) * 0.5;
    this.zoomExtents = [1, 12 + (f * 3)**2];
    this.showLabelFactor = 8 / this.minimisedCandidateScale;
    console.log("Dynamic scale", f, this.showLabelFactor, this.minimisedCandidateScale, this.zoomExtents);

    // Set this to true to allow rescaleMap to continue
    this._mapInitialized = true;

    // This is async so we need to wait
    this.rescaleMap().then(() => {

      // Init view and hide spinner
      this._reportProgress(100, true);

      // Show map tools
      this.shared.showMapTools = true;
    });

  }

  /*
  * Parse party colors from stylesheets as they are defined in the sass files
  */
  public parseColorsFromStylesheets(): void {
    // Get all party names and convert them to class names
    // We'll need this dict to convert class names back to party names later
    const class2party = {};
    this.parties.forEach(p => class2party[this.toClassName.transform(p.name)] = p.name);
    // Create a RegExp that matches party colors
    const classNames = Object.keys(class2party).join("|");
    const selectorRE = new RegExp(`(?:^|\\s)\\.${PARTY_SELECTOR_PREFIX}(${classNames})(?:$|\\s)`);
    // NB. We cannot use Array methods with these
    for (let i = 0; i < document.styleSheets.length; i++) {
      let sheet = document.styleSheets[i];
      // Filter out external style sheets as accessing them will cause DOM expections
      if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];
          if (rule instanceof CSSStyleRule) {
            const sel = rule.selectorText;
            const match = sel.match(selectorRE);
            if (match) {
              const col = rule.style.getPropertyValue(PARTY_COLOR_PROPERTY);
              // Save the color in the colors dict with the original party name
              // so we don't have to do conversions later on when matching colors
              if (col) this.colors[class2party[match[1]]] = col;
            }
          }
        }
      }
    }
  }

  /*
  * Handle operations needed when the map dimensions change 
  * (or are initially set)
  */
  public async rescaleMap(): Promise<void> | null {

    // This might be called prematurely by onWindowResize
    if (!this._mapInitialized)
      return null;

    return new Promise<void>(resolve => {

      // Disperse clustered candidates
      // This is async so we need to wait
      this.disperseAvatars().then(() => {

        // Creates the avatars array for map-canvas
        this.initMapMarkerData();

        // Ready
        resolve();
      });
    });

  }

  /*
  * On window resize, call rescaleMap while preventing multiple calls
  */
  // // Causes performance leaks, so it's disabled
  // public onWindowResize(): void {

  //   // If a call hasn't already been made
  //   if (!this._windowResizeLock) {

  //     // Lock resizing for the delay
  //     this._windowResizeLock = true;

  //     setTimeout(() => {

  //       // Save the current dimensions, so that we can check after the async operation
  //       // if they've been changed meanwhile
  //       const dimensions = [window.innerWidth, window.innerHeight];

  //       const checkAgain = () => {
  //         // ...release lock
  //         this._windowResizeLock = false;
  //         // But if the window size was changed while we were busy, start over
  //         if (dimensions[0] !== window.innerWidth || dimensions[1] !== window.innerHeight)
  //           this.onWindowResize();
  //       }

  //       // RescaleMap might return null if the map isn't initialized
  //       const promiseOrNull = this.rescaleMap();

  //       if (!promiseOrNull)
  //         checkAgain();
  //       else
  //         promiseOrNull.then(checkAgain);

  //     }, this.windowResizeDelay);
  //   }

  // }

  /*
  * Disperse candidates clustered too close together or too close to 
  * the voter marker.
  * This is async as it used d3.forceSimulation
  * TODO: Remake with dodge() at https://observablehq.com/@d3/beeswarm
  */
  public async disperseAvatars(): Promise<void> {

    return new Promise<void>(resolve => {

      // Dispersal offset
      const offsetRadius: number = this.dispersalRadiusMultiplier * this.markerScale * MAP_MARKER_CANDIDATE_HEAD_RADIUS;

      // We need to save the current scale, because the window size might change while we are running the simulation
      // Set the scale based on the smaller dimension
      const scale: number = this.width > this.height ? this.height : this.width;

      // For creating the nodes for dispersal
      const _makeNode = a => {
        // Scale the tsne values, as handing out values in the [0,1] range to the d3 simulation
        // doesn't work well
        const x = a.projX * scale,
              y = a.projY * scale;
        if (a.isVoter)
          // If the avatar is the voter, we make a node with fixed coordinates
          // and a flag which will be used below when defining the forces
          return { fx: x, fy: y, isVoter: true };
        else
          return { x, y, source: a };
      }

      // Map candidates plus the possible voter to nodes
      // NB. The non-null checks are there to resolve issues with multiple 
      // resize calls
      const nodes: any[] = this.candidates.filter(c => c != null).map(_makeNode);
      if (!this.voterDisabled && this.voter != null)
        nodes.push(_makeNode(this.voter));

      // Track time elapsed
      const start = performance.now();

      // Run dispersal force simulation
      // We add a bit larger radius and force for the voter marker
      const simulation = this.d3.forceSimulation(nodes)
        .force("disperse",
          this.d3.forceCollide()
            .radius(n => n.isVoter ? 3 * offsetRadius : offsetRadius)
            .strength(0.7)
            .iterations(this.dispersalMaxIterations)
        )
        .alphaMin(this.dispersalAlphaMin);

      // Call this when simulation is ready
      const _onSimulationReady = () => {

        // Purge
        simulation.on('end', null);
        simulation.on('tick', null);
        simulation.stop();
        simulation.nodes = [];

        // Ensure that all candidates are still in the 0-1 range after dispersal
        // and apply revised values to candidates' x and y properties
        // NB. We don't edit the projected values themselves as this would mess 
        // up things when the window is rescaled
        for (let n of nodes.filter(n => n.source)) {
          n.source.x = n.x / scale;
          n.source.y = n.y / scale;
        }

        // Ready
        resolve();
      }

      // Force ending if maximum duration is reached even if we haven't
      // reached alpha min
      simulation.on("tick", () => {
        if (performance.now() - start > this.dispersalMaxDuration)
          _onSimulationReady();
      });

      // If it ends on it's own account
      simulation.on("end", _onSimulationReady);
    });

  }

  /*
  * Initializes the markerData list
  */
  public initMapMarkerData(): void {

    // Reset
    if (this.markerData)
      this.markerData.forEach(m => m.dispose());
    this.markerData = [];

    // Conflate markers: candidates, parties and the possible voter
    const lists = {
      "candidate": this.candidates,
      "party": this.parties
    };
    if (!this.voterDisabled)
      lists["voter"] = [this.voter];

    // Prepare the color dictionary
    // TODO Make sure the stylesheets are available at this point
    this.parseColorsFromStylesheets();

    // Create data for each object
    for (const type in lists) {

      lists[type].forEach(a => {

        // Check this avoid errors, when the page is resized
        // during loading
        if (!a)
          return;

        let m: MapDatum;

        const opts: any = {
          source: a,
          x: a.x ?? a.projX,
          y: a.y ?? a.projY,
          layer: 10,
          color: null
        }

        switch (type) {

          case "voter":
            m = new MapDatumVoter({
              ...opts,
              color: this.voterColor,
              transition: { 
                state: "normal"
              }
            });
            break;

          case "candidate":
            m = new MapDatumCandidate({
              ...opts,
              color: this.colors[a.partyName],
              label: this.getCandidateLabel(a),
              transition: { 
                state: "minimised"
              }
            });
            break;

          case "party":
            m = new MapDatumParty({
              ...opts,
              color: this.colors[a.name],
              label: `${this.genitive.transform(a.name)} ehdokkaiden keskipiste`,
              text: this.abbreviate.transform(a.name)
              // Parties are hidden by default, so we don't set any transitionTo
            });
            break;
        }

        this.markerData.push(m);
      })
    }

    // Finally we need to call updateMapMarkerData to check for filtering and the active candidate
    // NB. This is redundant as the changes are caught by MapCanvas' ngOnChanges but maybe it's
    // best to be sure...
    this.updateMapMarkerData(MapRedrawOptions.ReInitialize);
  }

  /*
   * Perform a light update on the markerData list
   * Includes activeCandidate and filters
   */
  public updateMapMarkerData(options: MapRedrawOptions = MapRedrawOptions.RedrawOnly): void {

    const favourites = this.matcher.getFavourites();

    this.markerData.forEach((m: MapDatum) => {

      // Shorthands
      const state = m.marker?.state;
      const toState = m.marker?.transitionTo;

      if (m instanceof MapDatumCandidate) {

        const o = m.options;

        if (favourites.includes(o.source.id))
          o.favourite = true;
        else if (o.favourite)
          o.favourite = false;

        if (o.source.filteredOut) {
          // Candidates filtered out 
          // Set layer 5 for candidates filtered out as they need to be drawn behing the others
          o.layer = 5;

          if (state !== "disabled" && toState !== "disabled") {
            if (o.showLabel)
              // If we just filtered out the active candidate, we need also to clear the
              // showLabel attribute
              o.transition = { state: "disabled", showLabel: false };
            else
              o.transition = { state: "disabled" };
          }

        } else if (o.source.id === this.shared.activeCandidateId) {
          // The currently active candidate
          if (state !== "active" && toState !== "active")
            o.transition = { state: "active", showLabel: true };

        } else {
          // Reset other previously active or disabled candidates
          o.layer = 10;
          if (state !== "minimised" && toState !== "minimised") {
            if (o.showLabel)
              o.transition = { state: "minimised", showLabel: false };
            else
              o.transition = { state: "minimised" };
          }
        }

      } else if (m instanceof MapDatumParty) {

        const o = m.options;

        if (this.showPartyAvatar(o.source.name)) {
          // Show parties that should be visible
          if (state !== "normal" && toState !== "normal")
            o.transition = { state: "normal" };

        } else if (state != null && state !== "void") {
          // Hide others. A nullish state means the marker hasn't been 
          // initialized yet, so we'll also disregard those
          o.transition = { state: "void" };
        }
      }
    });

    // Notify map canvas passing from initMapMarkerData()
    this.redrawEmitter.emit(options);
  }

  public onMarkerClick(data: MapMarkerClickData): void {

    if (data.datum instanceof MapDatumCandidate) {

      this.shared.toggleCandidate.emit({
        id: data.datum.source.id
      });

    } else if (data.datum instanceof MapDatumParty) {

      this.partyMenuTriggerProperties = {
        x: `${data.x}px`,
        y: `${data.y}px`,
        data: { party: data.datum.source.name }
      }
      this.partyMenuTrigger.openMenu();

    } else if (data.datum instanceof MapDatumVoter) {

      this.voterMenuTriggerProperties = {
        x: `${data.x}px`,
        y: `${data.y}px`,
      }
      this.voterMenuTrigger.openMenu();

    } else {

      throw new Error(`Unknown click event datum: '${data.datum.constructor.name}'!`);

    }


  }

  public getPartyMenuData(): {party: string} {
    return this.partyMenuTriggerProperties.data;
  }

  // Called when the map backgound is clicked
  public hideCandidate(): void {
    this.shared.hideCandidate.emit();
  }

  public getCandidateLabel(candidate: Candidate): string {
    // return `${this.initials.transform(candidate.givenName)}\xa0${candidate.surname}, ${this.abbreviate.transform(candidate.party)}`;
    return `${candidate.givenName}\xa0${candidate.surname}, ${candidate.party.abbreviation}`;
  }

  public showPartyAvatar(party: string): boolean {
    return  this.shared.showAllParties || 
           (!this.matcher.partyIsExcluded(party) &&
            this.shared.activeCandidateId != null && 
            party == this.matcher.getCandidate(this.shared.activeCandidateId).partyName) ||
            this.matcher.partyIsRequired(party);
  }

  /*
   * Center map (on voter)
   */
  public locateSelf(): void {
    this.hideCandidate();
    this.zoomEmitter.emit({
      x: this.voterDisabled ? 0.5 : this.voter.projX,
      y: this.voterDisabled ? 0.5 : this.voter.projY,
      toScale: 1.
    });
  }

  public goToQuestions(): void {
    this.router.navigate([PATHS.questions]);
  }

  public showFavourites(): void {
    this.shared.showFavourites.emit();
  }

  public setPartyFilter(action: "show" | "hide" | "showAll"): void {
    // We have to fetch the party name now and cannot pass data to mat-menu,
    // as the data passed is not updated fast enough
    const exclude = action === "hide" ? true : false;
    const party = action === "showAll" ? null : this.partyMenuTriggerProperties.data.party;
    // Call Matcher
    this.matcher.setPartyFilter(party, exclude);
    this.shared.logEvent('map_party_filter_set', { party, exclude });
  }

  public isOnlyActivePartyFilter(): boolean {
    // We have to fetch the party name now and cannot pass data to mat-menu,
    // as the data passed is not updated fast enough
    // True at the end requires the party be the only active
    return this.matcher.partyIsRequired(this.partyMenuTriggerProperties.data.party, true);
  }

  get partyFiltersActive(): boolean {
    return this.matcher.hasPartyFilter;
  }

  private _reportProgress(value: number = null, complete = false) {
    if (complete || value >= 100)
      this.shared.loadingState.next({type: 'loaded'});
    else
      this.shared.loadingState.next({
        type: 'loading',
        message: 'Ladataan tuloksia…',
        value
      })
  }
}