import { Component, Inject, OnInit } from '@angular/core';

import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { MatcherService, Candidate, Question } from '../core/matcher.service';
import { SharedService } from '../core/shared.service';

export const MISSING_DATA_INFO_CLASS = "missingData";
export const MISSING_DATA_INFO = `<span class="${MISSING_DATA_INFO_CLASS}">Ei vastausta</span>`;

@Component({
  selector: 'app-details-candidate',
  templateUrl: './details-candidate.component.html',
  styleUrls: ['./details-candidate.component.css']
})
export class DetailsCandidateComponent implements OnInit {
  public candidate: Candidate;
  private candId: string;
  public opinions = { // Will house question lists
    agreed: null,
    disagreed: null,
    unanswered: null,
  };

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matcher: MatcherService,
    private shared: SharedService
  ) {
    this.candId = data.id;
    this.matcher.precinctDataReady$.subscribe(() => this.candidate = matcher.getCandidate(this.candId));
  }

  ngOnInit() {
    this.matcher.precinctDataReady$.subscribe(() => this.initQuestions());
  }

  private initQuestions(): void {
    this.opinions.agreed = this.matcher.getAgreedQuestionsAsList(this.candId);
    this.opinions.disagreed = this.matcher.getDisagreedQuestionsAsList(this.candId);
    this.opinions.unanswered = this.matcher.getUnansweredQuestionsAsList(this.candId);
  }

  public dismiss(event: MouseEvent = null): void {
    this.bottomSheetRef.dismiss();
    if (event != null) {
      event.preventDefault();
    }
  }

  public openLink(event: MouseEvent): void {
    this.dismiss(event);
  }

  public getVoterAnswer(id: string): number {
    let a = this.matcher.getVoterAnswer(id);
    return a ? a : null;
  }

  public getCandidateAnswer(id: string): number {
    if (this.matcher.isMissing(this.candidate[id])) {
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

  public getOrMissing(key: string, process: Function = (x) => x ): string {
    if (this.matcher.isMissing(this.candidate[key])) {
      return MISSING_DATA_INFO;
    } else {
      return process(this.candidate[key]);
    }
  }

  get partyClassName() {
    return 'party-' + this.shared.toClassName(this.candidate.party);
  }
  get givenName() {
    return this.candidate.givenName;
  }
  get surname() {
    return this.candidate.surname;
  }
  get party() {
    return this.candidate.party;
  }
  get number() {
    return this.candidate.number;
  }
  get education() {
    return this.getOrMissing("Q66");
  }
  get politicalExperience() {
    return this.getOrMissing("Q68");
  }
  get precinct() {
    return this.matcher.getPrecinctNameById(this.candidate.precinctId);
  }
  get age() {
    return this.getOrMissing("Q59");
  }
  get gender() {
    return this.getOrMissing("Q63");
  }
  get languages() {
    return this.getOrMissing("Q67", (x) => x.replace(/\s*,\s*/g, ', ').replace(/, ([^,]+)$/, ' ja $1') );
  }
  get fundingDescription() {
    if (this.matcher.isMissing(this.candidate.Q69)) {
      return MISSING_DATA_INFO;
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
        desc += `, jonka tärkeimpänä lähteenä ${ this.candidate.Q71 == "Yksityiset lahjoitukset" ? "ovat" : "on" } ${ this.shared.firstLetterToLowerCase(this.candidate.Q71) }.`;
      }
    }
    return desc;
  }
  get politicalParagon() {
    return this.getOrMissing("Q75");
  }
  get politicalParagonReason() {
    return this.getOrMissing("Q76");
  }
  get portraitUrl() {
    return `assets/images/candidate-portraits/${this.candidate.id}.jpg`;
  }

  get isFavourite() {
    return false;
  }

  public setFavourite(value: boolean): void {
    // TODO Implement
    window.alert("Favourite function is not yet implemented, sorry!");
  }

  // To enable persistent tab selection when comparing
  get lastOpenTab(): number {
    return this.shared.lastOpenCandidateDetailsTab;
  }
  set lastOpenTab(value: number) {
    this.shared.lastOpenCandidateDetailsTab = value;
  } 
}