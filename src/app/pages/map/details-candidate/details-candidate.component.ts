import { Component, 
         ElementRef, 
         Inject,
         OnInit,
         OnDestroy,
         AfterViewInit,
         AfterViewChecked,
         ViewChild,
         ViewEncapsulation } from '@angular/core';
import { DomSanitizer,
         SafeHtml } from '@angular/platform-browser';
import { trigger,
         style,
         animate,
         transition,
       } from '@angular/animations';
import { Subscription } from 'rxjs';

import { LcFirstPipe,
         SentencifyPipe } from '../../../core/pipes';
import { MatcherService, 
         Candidate, 
         Question, 
         PARTY_INDEPENDENT } from '../../../core';
import { SharedService } from '../../../core';
import { FloatingCardRef,
         FLOATING_CARD_DATA,
         ANIMATION_DURATION_MS as FLOATING_CARD_ANIMATION_DURATION_MS } from '../../../components/floating-card';
import { CustomExpanderComponent } from '../../../components';

export const DATA_CONTENT_CLASS = "content";
export const MISSING_DATA_INFO_CLASS = "detailsCandidateMissingData";
export const MISSING_DATA_INFO = "Ei vastausta";
export const MISSING_DATA_INFO_HTML = `<span class="${MISSING_DATA_INFO_CLASS}">${MISSING_DATA_INFO}</span>`;
const ANIMATION_TIMING = "225ms cubic-bezier(0.4, 0, 0.2, 1)";
const GOTO_QUESTION_DELAY = 225;


/* 
 * A utility class to publish styles to the global ns
 */
@Component({
  selector: 'app-details-candidate-global-styles',
  template: '',
  styleUrls: ['./details-candidate.global.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class DetailsCandidateGlobalStylesComponent {
  constructor() {}
}

/* 
 * <app-details-candidate>
 */
@Component({
  selector: 'app-details-candidate',
  templateUrl: './details-candidate.component.html',
  styleUrls: ['./details-candidate.component.sass'],
  animations: [
    trigger('appearHorisontally', [
      transition(':enter', [
        style({
          width: '0px',
        }),
        animate(ANIMATION_TIMING, style({
          width: '*',
        })),
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMING, style({
          width: '0px',
        }))
      ]),
    ]),
    trigger('appearVertically', [
      transition(':enter', [
        style({
          height: '0px',
        }),
        animate(ANIMATION_TIMING, style({
          height: '*',
        })),
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMING, style({
          height: '0px',
        }))
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(ANIMATION_TIMING, style({
          opacity: 1,
        })),
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMING, style({
          opacity: 0,
        }))
      ]),
    ]),
  ]
})
export class DetailsCandidateComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('header') header: ElementRef<HTMLElement>;
  @ViewChild('tabGroup', {read: ElementRef}) tabGroup: ElementRef;
  @ViewChild('expanderDisagreed') expanderDisagreed: CustomExpanderComponent;
  public candidate: Candidate;
  public opinions: { [key: string]: Question[] } = { // Will house question lists
    agreed: null,
    disagreed: null,
    unanswered: null,
  };
  public excerpts: { [key: string]: Question[] } = { // Sublists of opinions to show as excerpts
    agreed: null,
    disagreed: null,
    unanswered: null,
  };
  public excerptMores: { [key: string]: number } = { // Strings to add after excerpts if there are more than the ones shown
    agreed: null,
    disagreed: null,
    unanswered: null,
  }
  public excerptMaxLength: number = 9;
  public peekOffset: string = '1rem';
  public opinionsTabIndex: number = 2;
  private _tabBodies: NodeList;
  private _tabBodyHeight: string = '';
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  public get isMaximised(): boolean {
    return this.floatingCardRef.isMaximised;
  }

  constructor(
    private floatingCardRef: FloatingCardRef,
    @Inject(FLOATING_CARD_DATA) public data: any,
    private matcher: MatcherService,
    private shared: SharedService,
    private sanitizer:  DomSanitizer,
    private lcFirst: LcFirstPipe,
    private sentencify: SentencifyPipe,
  ) {
  }

  ngOnInit() {
    this._subscriptions.push(
      this.matcher.constituencyDataReady.subscribe(() => {
        this.candidate = this.matcher.getCandidate(this.data.id);
        this.initQuestions();
      })
    );
    // We use this to signal the map avatars
    this.shared.activeCandidateId = this.data.id;
  }

  ngAfterViewInit() {
    // Header needs to be initialized
    // This will also set up draggability
    this.floatingCardRef.setPeekElement(this.header, {
      offset: this.peekOffset,
      // Use persistentHeight as the header height will be miscalculated on minimise because
      // the lower part of the header is not rendered in the maximised state
      persistentHeight: true,
    });
  }

  ngAfterViewChecked() {

    // Calculate a height for mat-tab-body elements so the user can scroll inside them.
    // NB. We can't use div.mat-tab-body-wrapper as it's style is reset ever so often.

    // Find the elements if we haven't done it yet
    if (!this._tabBodies || this._tabBodies.length === 0) {
      this._tabBodies = this.tabGroup.nativeElement.querySelectorAll('mat-tab-body');
    }

    if (this._tabBodies.length > 0) {

      // Update tab body height
      const bodyOffset = (this._tabBodies[0] as HTMLElement).getBoundingClientRect().top - this.floatingCardRef.getBoundingClientRect().top;
      const bodyHeight = `calc(100vh - ${bodyOffset}px)`;

      // Only update style if height has changed
      if (bodyHeight !== this._tabBodyHeight) {
        this._tabBodies.forEach(e => (e as HTMLElement).style.height = bodyHeight);
        this._tabBodyHeight = bodyHeight;
      }

    }
  }

  ngOnDestroy() {
    // We use this to signal the map avatars
    if (this.shared.activeCandidateId === this.data.id) {
      this.shared.activeCandidateId = null;
    }
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  private initQuestions(): void {
    this.opinions.agreed = this.matcher.getAgreedQuestionsAsList(this.data.id, true); // True here means we are using approximate matching
    this.opinions.disagreed = this.matcher.getDisagreedQuestionsAsList(this.data.id, true);
    this.opinions.unanswered = this.matcher.getUnansweredQuestionsAsList(this.data.id);
    // Setup excerpts
    for (const key in this.opinions) {
      if (this.opinions[key].length <= this.excerptMaxLength + 1) {
        this.excerpts[key] = this.opinions[key];
      } else {
        this.excerpts[key] = this.opinions[key].slice(0, this.excerptMaxLength);
        this.excerptMores[key] = this.opinions[key].length - this.excerptMaxLength;
      }
    }
  }

  public toggle(): void {
    this.floatingCardRef.toggle();
    if (!this.isMaximised)
      this.shared.logEvent('candidate_maximise', {id: this.candidate.id});
  }

  public peek(): void {
    this.floatingCardRef.peek();
  }

  public maximise(): void {
    this.floatingCardRef.maximise();
    this.shared.logEvent('candidate_maximise', {id: this.candidate.id});
  }

  public dismiss(event: MouseEvent = null): void {
    this.floatingCardRef.close();
    if (event != null) {
      event.preventDefault();
    }
  }

  public openLink(event: MouseEvent): void {
    this.dismiss(event);
  }

  public maximiseAndGoToQuestion(elementId: string): void {

    let delay = FLOATING_CARD_ANIMATION_DURATION_MS + GOTO_QUESTION_DELAY;

    // If we need to change the tab, let's make the delay longer
    // NB. We could also wait for the tabGroup's done event, but that's kinda overkill
    if (this.lastOpenTab !== this.opinionsTabIndex) {
      this.lastOpenTab = this.opinionsTabIndex;
      delay *= 2;
    }

    setTimeout(() => {
      this.expanderDisagreed.expandAndScrollTo(elementId);
    }, delay);

    this.shared.logEvent('candidate_maximise_and_goto', {id: this.candidate.id});
  }

  public logExpand(category: string, scrollTo: string = null): void {
    this.shared.logEvent('candidate_expand_answers', {id: this.candidate.id, category: category, scrollTo: scrollTo});
  }

  public getVoterAnswer(id: string): number {
    let a = this.matcher.getVoterAnswer(id);
    return a ? a : null;
  }

  public getCandidateAnswer(id: string): number {
    // NB. The 2nd parameter (true) needed to check for missing Likert values
    if (this.matcher.isMissing(this.candidate[id], true)) {
      return null;
    } else {
      return Number(this.candidate[id]);
    }
  }

  public getCandidateAnswerOpen(id: string): string {
    const oId = this.matcher.getOpenAnswerId(id);
    if (oId) {
      return this.matcher.isMissing(this.candidate[oId]) ? null : this.candidate[oId];
    } else {
      throw new Error(`No open answer related to question ${id}.`);
    }
  }

  public getPartyAverage(id: string): number | null {
    if (this.candidate.party != PARTY_INDEPENDENT) {
      return this.matcher.getPartyAverage(this.candidate.party, id);
    } else {
      return null;
    }
  }

  public getOrMissing(key: string, process: Function = (x) => x ): string {
    if (this.matcher.isMissing(this.candidate[key])) {
      return MISSING_DATA_INFO;
    } else {
      return process(this.candidate[key]);
    }
  }

  get missingDataInfo(): string {
    return MISSING_DATA_INFO;
  }

  get missingDataInfoClass(): string {
    return MISSING_DATA_INFO_CLASS;
  }

  get dataContentClass(): string {
    return DATA_CONTENT_CLASS;
  }

  /*
   * This is rather unelegant but it checks the datum and if it's missing
   * returns also the missing info class
   */
  public getContentClasses(datum: string): string {
    return `${this.dataContentClass} ${this[datum] == this.missingDataInfo ? this.missingDataInfoClass : ''}`;
  }

  get givenName(): string {
    return this.candidate.givenName;
  }
  get surname(): string {
    return this.candidate.surname;
  }
  get party(): string {
    return this.candidate.party;
  }
  get number(): number {
    return this.candidate.number;
  }
  get education(): string {
    return this.getOrMissing("Q66");
  }
  get politicalExperience(): string {
    return this.getOrMissing("Q68");
  }
  get constituency(): string {
    return this.matcher.getConstituencyNameById(this.candidate.constituencyId);
  }
  get age(): string {
    return this.getOrMissing("Q59");
  }
  get gender(): string {
    let text = this.getOrMissing("Q63");
    if (typeof text === 'string' && text.indexOf(" ") === -1) {
      // Lowercase first unless it's a sentence, ie. En halua sanoa
      text = this.lcFirst.transform(text);
    }
    return text;
  }
  get languages(): string {
    return this.getOrMissing("Q67");
  }
  get fundingDescription(): SafeHtml {
    if (this.matcher.isMissing(this.candidate.Q69)) {
      return this.sanitizer.bypassSecurityTrustHtml(MISSING_DATA_INFO_HTML);
    }
    let desc = "Käytän vaalein rahaa ";
    desc += `<strong>${ this.candidate.Q69.replace("-", "—").replace(/\s*000\b/g, "\xa0000").replace(/\s*euroa/, "</strong>\xa0€") }`;
    if (this.matcher.isMissing(this.candidate.Q70)) {
      desc += ` <span class="${MISSING_DATA_INFO_CLASS}">Ei vastausta ulkopuolisen rahoituksen osuudesta.</span>`;
    } else if (this.candidate.Q70 == "0%") {
      desc += ", eikä ulkopuolista rahoitusta ei ole lainkaan."
    } else {
      desc += `. Tästä ulkopuolista rahoitusta on ${ this.candidate.Q70.replace("-", "—").replace(/\s*%/g, "\xa0%") }`;
      if (this.matcher.isMissing(this.candidate.Q71) || this.candidate.Q71 == "Joku muu") {
        desc += `. <span class="${MISSING_DATA_INFO_CLASS}">Ei vastausta ulkopuolisen rahoituksen lähteestä.</span>`;
      } else {
        desc += `, jonka tärkeimpänä lähteenä ${ this.candidate.Q71 == "Yksityiset lahjoitukset" ? "ovat" : "on" } ${ this.lcFirst.transform(this.candidate.Q71) }.`;
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(desc);
  }
  get politicalParagonAndReason(): SafeHtml {
    if (this.matcher.isMissing(this.candidate["Q75"])) {
      return this.sanitizer.bypassSecurityTrustHtml(MISSING_DATA_INFO_HTML);
    } else {
      let text = `<span class="content-emphasis">${this.sentencify.transform(this.candidate["Q75"])}</span>`;
      if (!this.matcher.isMissing(this.candidate["Q76"])) {
        text += ` <span [innerHtml]="politicalParagonReason">${this.candidate["Q76"]}</span>`;
      }
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }
  get politicalParagon(): string {
    return this.getOrMissing("Q75");
  }
  get politicalParagonReason(): string {
    return this.getOrMissing("Q76");
  }
  get portraitUrl(): string {
    return this.matcher.getCandidatePortraitUrl(this.candidate.id);
  }
  get whyMe(): string {
    return this.getOrMissing("Q74");
  }
  get promises(): string[] {
    let list = [];
    ['Q60', 'Q61', 'Q62'].forEach( (key) => {
      if (!this.matcher.isMissing(this.candidate[key])) {
        list.push(this.candidate[key]);
      }
    });
    return list;
  }
  get committees(): string[] {
    let list = [];
    ['Q72', 'Q73'].forEach( (key) => {
      if (!this.matcher.isMissing(this.candidate[key])) {
        list.push(this.candidate[key]);
      }
    });
    return list;
  }

  get isFavourite(): boolean {
    return this.matcher.getFavourites().includes(this.data.id);
  }

  public setFavourite(add: boolean, event: MouseEvent): void {
    if (add) {
      this.matcher.addFavourite(this.data.id);
    } else {
      this.matcher.removeFavourite(this.data.id);
    }
    // Disable floating card maximation
    event.stopPropagation();
  }

  // To enable persistent tab selection when comparing
  get lastOpenTab(): number {
    return this.shared.lastOpenCandidateDetailsTab;
  }
  set lastOpenTab(value: number) {
    this.shared.lastOpenCandidateDetailsTab = value;
    this.shared.logEvent('candidate_change_tab', {index: value, id: this.data.id});
  }
}