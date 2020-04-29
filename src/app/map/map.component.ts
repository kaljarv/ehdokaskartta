import { Component, OnInit, ViewChild, Input, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import * as d3 from 'd3';

import { MatcherService, Candidate, MIN_VALS_FOR_TSNE } from '../core/matcher.service';
import { SharedService, QUESTIONS_PATH } from '../core/shared.service';

// The base for avatars
export class AvatarComponent {
  @Input('posBase') posBase: any;
  public xPos: number; // Position as fraction of available width
  public yPos: number;
  public anchorXOffset = 0; // The avatar anchor point's offset, this can
  public anchorYOffset = 0; // normally be set as transform in css
  public scaleRoot = 4; // The nth root of zoomScale which is used to scale the avatar 

  constructor() {
  }

  public setPosition(x:number, y:number) {
    if (x > 1 || x < 0 || y > 1 || y < 0) {
      throw new Error("An Avatar's position values must be within 0–1.")
    }
    this.xPos = x;
    this.yPos = y;
  }

  get x() {
    return (this.xPos * (1 - 2 * this.posBase.marginFraction) + this.posBase.marginFraction) * this.posBase.scale + this.posBase.xOffset + this.anchorXOffset;
  }

  get y() {
    return (this.yPos * (1 - 2 * this.posBase.marginFraction) + this.posBase.marginFraction) * this.posBase.scale + this.posBase.yOffset + this.anchorYOffset;
  }

  get scale() {
    return this.posBase.zoomScale > 1 ? this.posBase.zoomScale ** (1 / this.scaleRoot) : 1;
  }
}


@Component({
  selector: '[candidate-avatar]',
  template: `
    <svg:circle
      [attr.cx]="x"
      [attr.cy]="y"
      [attr.r]="r"
      [ngClass]="className"
    ></svg:circle>
  `,
})
export class CandidateAvatarComponent extends AvatarComponent implements OnInit {
  @Input('candidate-avatar') candidate: Candidate;
  public baseRRem = 0.2;
  public filteredOutRRem = 0.1;

  constructor(
    private shared: SharedService
  ) {
    super();
  }

  ngOnInit() {
    this.setPosition(this.candidate.tsne1, this.candidate.tsne2);
  }

  get r() {
    return `${(this.candidate.filteredOut ? this.filteredOutRRem : this.baseRRem) * this.scale}rem`;
  }

  get className() {
    let c = 'party-' + this.shared.toClassName(this.candidate.party);
    if (this.candidate.filteredOut) c += ' filteredOut';
    return c;
  }
}


@Component({
  selector: '[voter-avatar]',
  templateUrl: './voter-avatar.component.html'
})
export class VoterAvatarComponent extends AvatarComponent implements OnInit {
  @Input('voter-avatar') voter: any;

  constructor(
  ) {
    super();
  }

  ngOnInit() {
    this.setPosition(0.5, 0.5);
  }

  get transformation() {
    return `translate(${this.x}, ${this.y}) scale(${this.scale})`;
  }
}


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  host: {
    '(window:resize)': 'calcPositionBase()'
  }
})
export class MapComponent implements OnInit {
  @ViewChild('map') mapSvg;
  @ViewChild('mapZoomContainer') mapZoomContainer;
  public candidates = new Array<Candidate>();
  private zoomScaleExtent = [1, 8];
  public progressValueEmitter: EventEmitter<number>;
  public isLoading: boolean;
  public toolTipClassBase = "map-tooltip";

  // These are global values for avatar placement
  // They are calculated based on zoom and window size
  public posBase = {
    scale: 1,
    xOffset: 0, // Global offset
    yOffset: 0,
    zoomScale: 1,
    zoomXOffset: 0,
    zoomYOffset: 0,
    marginFraction: 0.02 // Margin as fraction of total dim
  }

  constructor(
    private matcher: MatcherService,
    private router: Router,
    private shared: SharedService
  ) { 
    this.isLoading = true;
    this.progressValueEmitter = this.matcher.progressChanged$;
  }

  ngOnInit() {
    this.shared.title = "Tässä ovat tuloksesi.";
    this.shared.subtitle = "Voit muuttaa rajausta.";
    this.matcher.tsneDataReady$.subscribe(() => this.initMap());
    this.matcher.candidateDataReady$.subscribe(() => this.initData());
  }

  public initData() {
    if (this.matcher.countVoterAnswers() < MIN_VALS_FOR_TSNE ) {
      this.router.navigate([QUESTIONS_PATH]);
      return;
    }
    this.matcher.initTsne();
  }

  public initMap() {
    this.isLoading = false; // This will hide the spinner
    this.calcPositionBase();
    this.setupZoomability();
    this.candidates = this.matcher.getCandidatesAsList().sort( (a, b) => a.tsne2 - b.tsne2 );
    this.shared.showTopTools = true; // This will show the filtering tools

    // DEBUG
    // TODO remove
    let min = 0.5;
    let max = 0.5;
    this.candidates.forEach( c => {
      if (c.tsne1 < min) {
        min = c.tsne1;
      } else if (c.tsne1 > max) {
        max = c.tsne1;
      }
    });
    console.log("tsne1", min, max);
    
    min = 0.5;
    max = 0.5;
    this.candidates.forEach( c => {
      if (c.tsne2 < min) {
        min = c.tsne2;
      } else if (c.tsne2 > max) {
        max = c.tsne2;
      }
    });
    console.log("tsne2", min, max);
    // END DEBUG
  }

  get filteredInCandidates(): Candidate[] {
    return this.candidates.filter(c => !this.getFilteredOut(c));
  }
  get filteredOutCandidates(): Candidate[] {
    return this.candidates.filter(c => this.getFilteredOut(c));
  }

  public showCandidate(candidate: Candidate): void {
    this.shared.showCandidate.emit(candidate.id);
  }

  // TODO: Move these and the showCandidate onClick to the avatar component and let that emit an event
  public getTooltip(candidate: Candidate): string {
    return `${candidate.givenName}\xa0${candidate.surname}, ${candidate.party}`;
  }

  // If not candidate, get class for voter
  public getTooltipClass(candidate?: Candidate): string {
    // TODO: Add party classname string to this
    return `${this.toolTipClassBase} ${this.toolTipClassBase}--${candidate ? 'candidate' : 'voter'}`;
  }

  public getFilteredOut(candidate: Candidate): boolean {
    return candidate.filteredOut ? true : false;
  }

  // Calculate the base for avatar locations based on window size
  // The svg element itself fills the window but the area used for
  // display should be a rectangle based on the smaller dimension
  // Called on window resize
  public calcPositionBase() {

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

  private setupZoomability() {
    let svg, container, zoomed, zoom;

    svg = d3.select(this.mapSvg.nativeElement);
    container = d3.select(this.mapZoomContainer.nativeElement);

    zoomed = () => {
      const transform = d3.event.transform;
      this.posBase.zoomScale = transform.k;
      this.posBase.zoomXOffset = transform.x;
      this.posBase.zoomYOffset = transform.y;
      this.calcPositionBase();
      // container.attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
    };

    zoom = d3.zoom()
      .on("zoom", zoomed)
      .scaleExtent(this.zoomScaleExtent);
    svg.call(zoom);
  }
}