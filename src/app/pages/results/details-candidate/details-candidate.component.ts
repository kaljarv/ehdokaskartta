import { Component, 
         ElementRef, 
         EventEmitter, 
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
import { combineLatest,
         Subscription 
       } from 'rxjs';
import { first } from 'rxjs/operators';

import { LcFirstPipe,
         MatcherService, 
         Candidate, 
         Question,
         QuestionNumeric, 
         Party,
         SharedService,
         ANIMATION_TIMING,
         INDEPENDENT_PARTY_ID } from '../../../core';
import { FloatingCardRefBase,
         FLOATING_CARD_DATA,
         FLOATING_CARD_ANIMATION_DURATION_MS,
         CustomExpanderComponent } from '../../../components';



export interface DetailsCandidateOptions {
  id: string;
  maximise?: boolean;
}

export const DATA_CONTENT_CLASS = "content";
export const MISSING_DATA_INFO_CLASS = "detailsCandidateMissingData";
export const MISSING_DATA_INFO = "Ei vastausta";
export const MISSING_DATA_INFO_HTML = `<span class="${MISSING_DATA_INFO_CLASS}">${MISSING_DATA_INFO}</span>`;

const GOTO_QUESTION_DELAY = FLOATING_CARD_ANIMATION_DURATION_MS;


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
    trigger('portraitAppear', [
      transition(':enter', [
        style({
          marginRight: '0rem',
          width: '0px',
        }),
        animate(ANIMATION_TIMING, style({
          marginRight: '0.5rem',
          width: '50px',
        })),
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMING, style({
          marginRight: '0rem',
          width: '0px',
        }))
      ]),
    ]),
  ]
})
export class DetailsCandidateComponent 
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {

  @ViewChild('header') header: ElementRef<HTMLElement>;
  @ViewChild('tabGroup', {read: ElementRef}) tabGroup: ElementRef;
  @ViewChild('expanderDisagreed') expanderDisagreed: CustomExpanderComponent;

  public candidate: Candidate;
  public party: Party;
  public opinions: { [key: string]: QuestionNumeric[] } = { // Will house question lists
    agreed: [],
    disagreed: [],
    unanswered: [],
    all: []
  };
  public excerpts: { [key: string]: QuestionNumeric[] } = { // Sublists of opinions to show as excerpts
    agreed: [],
    disagreed: [],
    unanswered: []
  };
  public excerptMores: { [key: string]: number } = { // Strings to add after excerpts if there are more than the ones shown
    agreed: 0,
    disagreed: 0,
    unanswered: 0
  }
  public excerptMaxLength: number = 9;
  public peekOffset: number = 16;
  public opinionsTabIndex: number = 2;
  public detailsLoaded: boolean = false;

  private _tabBodies: NodeList;
  private _tabBodyHeight: string = '';
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Fire on afterViewInit
  private _viewInitialized = new EventEmitter<boolean>();

  constructor(
    private floatingCardRef: FloatingCardRefBase,
    @Inject(FLOATING_CARD_DATA) public data: DetailsCandidateOptions,
    private matcher: MatcherService,
    private shared: SharedService,
    private sanitizer:  DomSanitizer,
    private lcFirst: LcFirstPipe
  ) {
    this.shared.reportOverlayOpen({});
  }

  public get isMaximised(): boolean {
    return this.floatingCardRef.isMaximised;
  }

  public get usePortrait(): boolean {
    return this.floatingCardRef.usePortrait;
  }

  public get voterDisabled(): boolean {
    return this.shared.voterDisabled;
  }

  ngOnInit() {
    this._subscriptions.push(
      this.matcher.constituencyDataReady.subscribe(async () => {
        this.candidate = this.matcher.getCandidate(this.data.id);
        this.party = this.matcher.getParty(this.candidate.partyId);
        this._initQuestions();
        // We try to show the card here just in case the view was already initialized
        await this.candidate.loadDetails();
        this.detailsLoaded = true;
      })
    );
    // Show only after data is loaded and the view is initialized
    // First() will unsubscribe itself
    combineLatest([this.matcher.constituencyDataReady, this._viewInitialized]).pipe(
      first()
    ).subscribe(() =>
      this._showCardInitially()
    );
    // We use this to signal the map avatars
    this.shared.activeCandidateId = this.data.id;
  }

  ngAfterViewInit() {
    this._viewInitialized.emit(true);
  }

  ngAfterViewChecked() {
    // if (this.detailsLoaded)
    //   this._updateBodyHeight();
  }

  ngOnDestroy() {
    // We use this to signal the map avatars
    if (this.shared.activeCandidateId === this.data.id)
      this.shared.activeCandidateId = null;

    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;
    this.shared.reportOverlayClose();

    // Delete props
    this.floatingCardRef = null;
    this._tabBodies = null;
    this.candidate = null;
    this.party = null;
    this.opinions = null;
    this.excerpts = null;
    this.excerptMores = null;
  }

  private _ensureVisibleOnMap(): void {

    // We need this to calculate the occluded areas
    const fc = this.floatingCardRef;
    const offset = fc.getBoundingClientRect();

    // this.shared.ensureVisibleOnMap.emit({
    //   x: this.candidate.projX,
    //   y: this.candidate.projY,
    //   margin: 40,
    //   occluded: {
    //     // This is the top bar height with margins
    //     top: fc.options.landscapeMarginTop,
    //     left: fc.usePortrait ? 0 : offset.width + fc.options.landscapeMarginLeft,
    //     bottom: fc.usePortrait ? fc.peekHeight : 0,
    //     right: 0
    //   }
    // });
  }

  private _initQuestions(): void {

    this.opinions.all = this.matcher.getAnswerableQuestions(true);
    this.opinions.agreed = this.matcher.getAgreedQuestionsAsList(this.candidate, true);
    this.opinions.disagreed = this.matcher.getDisagreedQuestionsAsList(this.candidate, true);
    this.opinions.unanswered = this.matcher.getUnansweredQuestionsAsList(this.candidate);

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

  private _setPeekElement(): void {      
    // This will also set up draggability
    this.floatingCardRef.initPeek(this.header, {
      offset: this.peekOffset,
      // Use persistentHeight as the header height will be miscalculated on minimise because
      // the lower part of the header is not rendered in the maximised state
      persistentHeight: true
    });
  }

  private _showCardInitially(): void {

    // This will initialize the card
    if (this.usePortrait && !this.data.maximise)
      this._setPeekElement();
    else
      this.floatingCardRef.initMaximise();

    // Scroll map to ensure candidate marker is in view,
    // but add a small delay so that thing don't happen simultaneously
    setTimeout(() => this._ensureVisibleOnMap(), FLOATING_CARD_ANIMATION_DURATION_MS * 2);
  }

  /*
   * Calculate a height for mat-tab-body elements so the user can scroll inside them.
   * NB. We can't use div.mat-tab-body-wrapper as it's style is reset ever so often.
   */
  private _updateBodyHeight(): void {

    // Find the elements if we haven't done it yet
    if (!this._tabBodies || this._tabBodies.length === 0)
      this._tabBodies = this.tabGroup.nativeElement.querySelectorAll('mat-tab-body');

    if (this._tabBodies.length > 0) {

      // Update tab body height
      // If we are using landscape mode, we need to add the offset as we are not using
      // the full viewport height
      let bodyOffset = (this._tabBodies[0] as HTMLElement).getBoundingClientRect().top - this.floatingCardRef.getBoundingClientRect().top;
      bodyOffset += this.floatingCardRef.usePortrait ? 0 : this.floatingCardRef.options.landscapeMarginTop;
      const bodyHeight = `calc(100vh - ${bodyOffset}px)`;

      // Only update style if height has changed
      if (bodyHeight !== this._tabBodyHeight) {
        this._tabBodies.forEach(e => (e as HTMLElement).style.height = bodyHeight);
        this._tabBodyHeight = bodyHeight;
      }

    }
  }

  public toggle(): void {
    this.floatingCardRef.toggle();
    if (!this.isMaximised)
      this.shared.logEvent('candidate_maximise');
  }

  public peek(): void {
    this.floatingCardRef.peek();
  }

  public maximise(): void {
    this.floatingCardRef.maximise();
    this.shared.logEvent('candidate_maximise');
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

    this.shared.logEvent('candidate_maximise_and_goto');
  }

  public logExpand(category: string, scrollTo: string = null): void {
    this.shared.logEvent('candidate_expand_answers');
  }

  public getVoterAnswer(question: QuestionNumeric): number | number[] {
    return question.voterAnswer;
  }

  private _getQuestion(questionOrId: Question | string): Question {
    const question: Question = questionOrId instanceof Question ? 
                               questionOrId : 
                               this.matcher.questions[questionOrId];
    if (!question)
      throw new Error(`Question with id '${questionOrId}' does not exist!`);
    return question;
  }

  public getAnswer(questionOrId: Question | string): any {
    return this.candidate.getAnswer(this._getQuestion(questionOrId));
  }

  public getNumericAnswer(question: QuestionNumeric): number | number[] {
    const answer = this.getAnswer(question);
    return question.isMissing(answer) ? null : 
           Array.isArray(answer) ? answer : Number(answer);
  }

  public getRelated(question: Question): string {
    const oId = question.relatedId;
    if (oId) {
      const related = this._getQuestion(oId);
      const answer = this.getAnswer(oId);
      return related.isMissing(answer) ? null : answer;
    }
    return null;
  }

  public isMissing(questionOrId: Question | string): boolean {
    const question = this._getQuestion(questionOrId);
    return question.isMissing(this.getAnswer(question));
  }

  public getPartyAverage(question: QuestionNumeric): number | number[] | null {
    return this.party.id != INDEPENDENT_PARTY_ID ? 
           this.party.getAnswer(question) :
           null;
  }

  public getOrMissing(questionOrId: Question | string, process: Function = (x) => x ): string {
    return this.isMissing(questionOrId) ?
           MISSING_DATA_INFO :
           process(this.getAnswer(questionOrId));
  }

  public getOrMissingMultiple(questionOrId: Question | string, process: Function = (x) => x ): string[] {
    return this.isMissing(questionOrId) ?
           [MISSING_DATA_INFO] :
           this.getAnswer(questionOrId).map(v => process(v));
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
  get partyName(): string {
    return this.party.name;
  }
  get partyAbbreviation(): string {
    return this.party.abbreviation;
  }
  get number(): number | string {
    return this.candidate.number;
  }
  get numberLong(): number | string {
    return this.number === '?' ? this.missingDataInfo : this.number;
  }
  get education(): string {
    return this.getOrMissing("education");
  }
  get motherTongue(): string {
    return this.getOrMissing("language");
  }
  get languageSkills(): string {
    return this.getOrMissing("languageSkills");
  }
  get zipCode(): string {
    return this.getOrMissing("zipCode");
  }
  get occupation(): string {
    return this.getOrMissing("occupation");
  }
  get municipality(): string {
    return this.getOrMissing("municipality");
  }
  get politicalExperience(): string {
    return this.getOrMissingMultiple("politicalExperience").join(", ");
  }
  get constituency(): string {
    return this.matcher.getConstituencyNameById(this.candidate.constituencyId);
  }
  get age(): string {
    return this.getOrMissing("age");
  }
  get gender(): string {
    let text = this.getOrMissing("gender");
    if (typeof text === 'string' && text.indexOf(" ") === -1) {
      // Lowercase first unless it's a sentence, ie. En halua sanoa
      text = this.lcFirst.transform(text);
    }
    return text;
  }
  get languages(): string {
    return this.getOrMissingMultiple("languageSkills").join(", ");
  }
  get fundingDescription(): SafeHtml {
    if (this.isMissing("electionBudget")) {
      return this.sanitizer.bypassSecurityTrustHtml(MISSING_DATA_INFO_HTML);
    }
    let desc = "Käytän vaalein rahaa ";
    desc += `<strong>${ this.candidate.getAnswer('electionBudget').replace("-", "—").replace(/\s*000\b/g, "\xa0000").replace(/\s*euroa/, "</strong>\xa0€") }`;
    // if (this.isMissing("Q70")) {
    //   desc += ` <span class="${MISSING_DATA_INFO_CLASS}">Ei vastausta ulkopuolisen rahoituksen osuudesta.</span>`;
    // } else if (this.candidate.getAnswer('Q70') == "0%") {
    //   desc += ", eikä ulkopuolista rahoitusta ei ole lainkaan."
    // } else {
    //   desc += `. Tästä ulkopuolista rahoitusta on ${ this.candidate.getAnswer('Q70').replace("-", "—").replace(/\s*%/g, "\xa0%") }`;
    //   if (this.isMissing("Q71") || this.candidate.getAnswer('Q71') == "Joku muu") {
    //     desc += `. <span class="${MISSING_DATA_INFO_CLASS}">Ei vastausta ulkopuolisen rahoituksen lähteestä.</span>`;
    //   } else {
    //     desc += `, jonka tärkeimpänä lähteenä ${ this.candidate.getAnswer('Q71') == "Yksityiset lahjoitukset" ? "ovat" : "on" } ${ this.lcFirst.transform(this.candidate.getAnswer('Q71')) }.`;
    //   }
    // }
    return this.sanitizer.bypassSecurityTrustHtml(desc);
  }
  // get politicalParagonAndReason(): SafeHtml {
  //   if (this.isMissing("Q75")) {
  //     return this.sanitizer.bypassSecurityTrustHtml(MISSING_DATA_INFO_HTML);
  //   } else {
  //     let text = `<span class="content-emphasis">${this.sentencify.transform(this.getAnswer("Q75"))}</span>`;
  //     if (!this.isMissing("Q76")) {
  //       text += ` <span [innerHtml]="politicalParagonReason">${this.getAnswer("Q76")}</span>`;
  //     }
  //     return this.sanitizer.bypassSecurityTrustHtml(text);
  //   }
  // }
  // get politicalParagon(): string {
  //   return this.getOrMissing("Q75");
  // }
  // get politicalParagonReason(): string {
  //   return this.getOrMissing("Q76");
  // }
  get portraitUrl(): string {
    return this.matcher.getCandidatePortraitUrl(this.candidate);
  }
  get electionPromise(): string {
    return this.getAnswer("electionPromise");
  }
  // get whyMe(): string {
  //   return this.getOrMissing("Q74");
  // }
  get promises(): string[] {
    let list = [];
    ['electionPromise1', 'electionPromise2', 'electionPromise3'].forEach( (key) => {
      if (!this.isMissing(key)) {
        list.push(this.getAnswer(key));
      }
    });
    return list;
  }
  get themes(): string[] {
    return this.getOrMissingMultiple("electionTheme");
  }
  get hasUrls(): boolean {
    return this.facebook != null || this.instagram != null || this.twitter != null || 
           this.otherSocialMedia != null || this.campaignUrl != null;
  }
  get facebook(): string {
    return this.getAnswer("facebook");
  }
  get instagram(): string {
    return this.getAnswer("instagram");
  }
  get twitter(): string {
    return this.getAnswer("twitter");
  }
  get otherSocialMedia(): string {
    return this.getAnswer("otherSocialMedia");
  }
  get campaignUrl(): string {
    return this.getAnswer("url");
  }
  public isLink(text: string): boolean {
    return text.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/) != null;
  }
  // get committees(): string[] {
  //   let list = [];
  //   ['Q72', 'Q73'].forEach( (key) => {
  //     if (!this.isMissing(key)) {
  //       list.push(this.getAnswer(key));
  //     }
  //   });
  //   return list;
  // }

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
    this.shared.logEvent('candidate_change_tab');
  }
}