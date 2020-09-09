import { Injectable, 
         EventEmitter } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import * as tsnejs from './tsne/tsne';

import { DatabaseService } from '../database';

import { AgreementType,
         Likert } from './likert-utility';
import { MissingValue } from './missing-value-utility';
import { CandidateFilter,
         CandidateFilterOptions,
         CandidateFilterLogicOperator } from './candidate-filter';
import { CandidateFilterSimple } from './candidate-filter-simple';
import { CandidateFilterNumberRange } from './candidate-filter-number-range';
import { CandidateFilterQuestion } from './candidate-filter-question';

export const COOKIE_PREFIX = "CM-VoterAnswer-";
export const COOKIE_MUNICIPALITY = "Municipality";
export const COOKIE_FAVOURITES = "Favourites";
export const COOKIE_VALUE_SEPARATOR = ",";
export const COOKIE_PATH = "/";
export const COOKIE_DOMAIN = null;
export const COOKIE_LIFE = 1000 * 60 * 60 * 24 * 7; // Cookie lifetime in millisecs (the last number is day)
export const MAX_MISSING_VALS = -1; // Set to 0 or greater to cull candidates based on number of missing vals
export const NONMISSING_CANDIDATE_MAX_MISSING_VALS = 9; // The max number of missing vals before a candidate is flagged as missing, set to -1 to mark none
export const MIN_VALS_FOR_TSNE = 1; // We are enabling tSNE for the first answer
export const PARTY_INDEPENDENT = "Sitoutumaton";
export const QUESTION_LIKERT = "Likert";
export const QUESTION_OPEN = "Open";

export interface Question {
  id?: string,
  text?: string,
  topic?: string,
  category?: string,
  type?: string, // See QUESTION_LIKERT and QUESTION_OPEN
  relatedId?: string,
  dropped?: boolean,
  constituencyId?: number,
  voterAnswer?: number,
  partyAverages?: {
    [partyName: string]: number,
  },
}
export type QuestionDict = { [id: string]: Question }

export interface Candidate {
  id?: string, // The unique id = constituencyId_number, also used as the key in the dict
  number: number,
  surname: string,
  givenName: string,
  constituencyId: number,
  party: string,
  selected: number,
  tsne1?: number,
  tsne2?: number,
  filteredOut?: Set<any>,  // Will actually hold references to CandidateFilters
  missing?: boolean,       // Flag to mark candidates who didn't answer the questions but are still included
  [questionN: string]: any // Additionally has props Q1...Q209 corresponding to answers to questions
}
export type CandidateDict = { [id: string]: Candidate }

export interface Party {
  name?: string,
  tsne1?: number,
  tsne2?: number,
}
export type PartyDict = { [name: string]: Party }

export interface QuestionAverageDict {
  [questionId: string]: {
    [partyName: string]: number
  }
}

export enum DataStatus {
  NotReady,
  Ready,
  Updated,
}


/**********************************************************************
 * MATCHER SERVICE
 **********************************************************************/

@Injectable({
  providedIn: 'root'
})
export class MatcherService {
  private _municipality: string;
  private _municipalityId: number;
  private _constituency: string;
  private _constituencyId: number;
  private questions: QuestionDict;
  private correlationMatrix: any;
  private candidates: CandidateDict;
  private parties: PartyDict;
  private municipalities: any;
  private constituencies: any;
  private favourites: string[] = new Array<string>();
  public questionCategoryOrder = {
    "Liikenne": 7,
    "Arvot": 6,
    "Turvallisuus": 5,
    "Maahanmuutto": 4,
    "Perhe ja koulutus": 3,
    "Terveys": 2,
    "Raha": 1,
    "Ilmasto ja ymp\u00e4rist\u00f6": 0
  };
  private tsne;
  public tsneOptions = {
    perplexity: 30,
    epsilon: 10,
    maxChunks: 40,
    stepChunk: 25, // number of steps to complete in one chunk
  };
  private tsneIds: string[]; // Holds the candidateIds matching the elements in the tsne data array
  private tsneIntervalRef;
  public filterOpts: {[name: string]: { type: any, opts: CandidateFilterOptions }} = {
    question: {
      type: CandidateFilterQuestion,
      opts: {
        title: 'Kynnyskysymyksen perusteella',
        description: 'Näytä vain ehdokkaat, jotka ovat samaa tai lähes samaa mieltä kanssasi valituista kysymyksistä.',
        multipleValues: false,
      }
    },
    age: {
      type: CandidateFilterNumberRange,
      opts: {
        key: 'Q59',
        title: 'Iän perusteella',
        unitName: 'vuotta',
        // minDescription: 'Ikä vähintään', 
        // maxDescription: 'Ikä enintään', 
        multipleValues: false,
      }
    },
    gender: {
      type: CandidateFilterSimple,
      opts: {
        key: 'Q63',
        title: 'Sukupuolen perusteella',
        multipleValues: false,
      }
    },
    party: {
      type: CandidateFilterSimple,
      opts: {
        key: 'party',
        title: 'Puolueen perusteella',
        multipleValues: false,
      }
    },
    motherTongue: {
      type: CandidateFilterSimple,
      opts: {
        key: 'Q64',
        title: 'Äidinkielen perusteella',
        multipleValues: false,
      }
    },
    education: {
      type: CandidateFilterSimple,
      opts: {
        key: 'Q66',
        title: 'Koulutuksen perusteella',
        multipleValues: false,
      }
    },
    politicalExperience: {
      type: CandidateFilterSimple,
      opts: {
        key: 'Q68',
        title: 'Poliittisen kokemuksen perusteella',
        multipleValues: true,
        multipleValueLogicOperator: CandidateFilterLogicOperator.Or,
      }
    },
  };
  private filters: {
    [name: string]: CandidateFilter
  };
  public dataStatus = {
    constituencies:     new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    questions:          new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    candidates:         new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    tsne:               new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    filters:            new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    constituencyCookie: new BehaviorSubject<DataStatus>(DataStatus.NotReady),
  };
  // Shorthands for the dataStatuses
  public constituencyDataReady =   this.dataStatus.constituencies.pipe(filter(     t => t !== DataStatus.NotReady ));
  public questionDataReady =       this.dataStatus.questions.pipe(filter(          t => t !== DataStatus.NotReady ));
  public questionDataUpdated =     this.dataStatus.questions.pipe(filter(          t => t === DataStatus.Updated ));
  public candidateDataReady =      this.dataStatus.candidates.pipe(filter(         t => t !== DataStatus.NotReady ));
  public tsneDataReady =           this.dataStatus.tsne.pipe(filter(               t => t !== DataStatus.NotReady ));
  public filterDataReady =         this.dataStatus.filters.pipe(filter(            t => t !== DataStatus.NotReady ));
  public filterDataUpdated =       this.dataStatus.filters.pipe(filter(            t => t === DataStatus.Updated ));
  public constituencyCookieRead =  this.dataStatus.constituencyCookie.pipe(filter( t => t === DataStatus.Ready ));
  public progressChanged =         new EventEmitter<number>();

  constructor(
    private cookie: CookieService,
    private database: DatabaseService,
  ) {
    // Add subscriptions to take care of data status updates
    // See also setConstituency(), which resets statuses
    // QuestionDataUpdated is fired whenever the voter's answer change, so that annuls tsne, too
    this.questionDataUpdated.subscribe( () => this.dataStatus.tsne.next(DataStatus.NotReady) );
    // init
    this.initData();
  }

  private async initData(): Promise<void> {

    this.municipalities = await this.database.getMunicipalities();
    this.constituencies = await this.database.getConstituencies();
    this.dataStatus.constituencies.next(DataStatus.Ready);

    this.dataStatus.candidates.pipe(filter( t => t !== DataStatus.NotReady )).subscribe(() => {
      this.setFavouritesFromCookie();
      this.initFilters();
    });

    // Set municipality if it was saved in the cookie
    await this.setMunicipalityFromCookie();
  }

  // Getters
  get municipality(): string {
    return this._municipality;
  }

  get municipalityId(): number {
    return this._municipalityId;
  }

  get constituency(): string {
    return this._constituency;
  }

  get constituencyId(): number {
    return this._constituencyId;
  }

  public getConstituencyNameByMunicipalityId(id: number): string {
    if (id in this.municipalities) {
      return this.getConstituencyNameById(this.municipalities[id].constituencyId);
    } else {
      throw new Error(`Municipality id '${id}' not found.`);
    }
  }

  public getConstituencyNameById(id: number): string {
    if (id in this.constituencies) {
      return this.constituencies[id].name;
    } else {
      throw new Error(`Constituency id '${id}' not found.`);
    }
  }

  public getMunicipalitiesAsList(): any[] {
    return Object.keys(this.municipalities).map( (id) => { 
      let copy = { ...this.municipalities[id] };
      copy.id = Number(id);
      return copy;
    });
  }

  public async setMunicipality(id: number): Promise<void> {

    if (!(id in this.municipalities)) {
      throw new Error(`Municipality id '${id}' cannot be found in municipality list.`)
    }
    // Return if we don't change the municipality as setting the constituency will reset all answers
    if (id === this._municipalityId && this.candidates && this.questions) {
      return;
    }

    // Set municipality
    let m = this.municipalities[id];
    this._municipalityId = id;
    this._municipality = m.name;
    this._constituencyId = m.constituencyId;
    this._constituency = this.constituencies[this._constituencyId].name;
    this.writeCookie(COOKIE_MUNICIPALITY, this._municipalityId);
    await this.setConstituency(this._constituencyId);
  }

  private async setConstituency(id: number): Promise<void> {

    // Reset downstream data statuses
    this.dataStatus.questions.next(DataStatus.NotReady);
    this.dataStatus.candidates.next(DataStatus.NotReady);
    this.dataStatus.tsne.next(DataStatus.NotReady);
    this.dataStatus.filters.next(DataStatus.NotReady);
        
    // Import questions data
    this.questions = await this.database.getQuestions(id);
    for (const id in this.questions) {
      this.questions[id].id = id;
    }

    // Import correlation data
    this.correlationMatrix = await this.database.getCorrelationMatrix(id);
    // Clean up the matrix as it may contain questions that are not present in the questions list
    // (especially questions marked as dropped, which are excluded when getting questions)
    Object.keys(this.correlationMatrix).filter(q => !(q in this.questions)).forEach(q => {
      // Delete the question row
      delete this.correlationMatrix[q];
      // Delete the question column on each row
      for (const r in this.correlationMatrix) {
        delete this.correlationMatrix[r][q];
      }
    });

    // Read voter answers stored in the cookie
    this.setAnswersFromCookie();

    // Import candidate data
    this.candidates = await this.database.getCandidates(id);
    
    // Cull candidates with too many missing values
    // and flag candidates with missing values above the threshold
    if (MAX_MISSING_VALS > -1 || 
        NONMISSING_CANDIDATE_MAX_MISSING_VALS > -1) {
      let qids = this.getLikertQuestionIds();
      for (const id in this.candidates) {
        let missing = 0;
        qids.forEach( q => {
          if (this.isMissing(this.candidates[id][q], true)) {
            missing++;
          }
        });
        if (MAX_MISSING_VALS > -1 &&
            missing > MAX_MISSING_VALS) {
          delete this.candidates[id];
        } else if (NONMISSING_CANDIDATE_MAX_MISSING_VALS > -1 &&
                   missing > NONMISSING_CANDIDATE_MAX_MISSING_VALS) {
          this.candidates[id].missing = true;
        }
      }
    }

    // Add ids to Candidate objects themselves
    for (const id in this.candidates) {
      this.candidates[id].id = id;
    }

    // Emit change events
    this.dataStatus.questions.next(DataStatus.Ready);
    this.dataStatus.candidates.next(DataStatus.Ready);
  }

  // For convenience
  // NB. We need a different heuristic for checking Likert values
  public isMissing(value: any, likert: boolean = false): boolean {
    return (likert ? Likert : MissingValue).isMissing(value);
  }

  /*
  // We already filter these when fetching from Firebase
  public isRelevantQuestion(q: Question): boolean {
    return !q.dropped;
           && (!q.constituencyId || q.constituencyId === this.constituencyId);
  }
  */

  public getQuestionsByIds(ids: string[]): QuestionDict {
    if (! this.questions) {
      throw Error("Constituency must be defined before getting Questions");
    }
    let dict: QuestionDict = {};
    ids.forEach( id => dict[id] = this.questions[id] );
    return dict;
  }

  public getLikertQuestionIds(): string[] {
    if (! this.questions) {
      throw Error("Constituency must be defined before getting Questions");
    }
    return Object.keys(this.questions).filter( k => this.questions[k].type === QUESTION_LIKERT ); // && this.isRelevantQuestion(this.questions[k])
  }
 
  public getLikertQuestions(): QuestionDict {
    return this.getQuestionsByIds(this.getLikertQuestionIds());
  }

  public getLikertQuestionsAsList(): Question[] {
    return Object.values(this.getLikertQuestions()).sort( (a, b) => this.compareQuestions(a, b) );
  }

  public getCatOrder(q: Question): number {
    return q.category in this.questionCategoryOrder ? this.questionCategoryOrder[q.category] : 1e10;
  }

  public compareQuestions(a: Question, b: Question): number {
    let cDiff = this.getCatOrder(a) - this.getCatOrder(b);
    if (cDiff !== 0) {
      return cDiff;
    } else {
      return a.id < b.id ? -1 : 1;
    }
  }

  public getQuestion(id: string): Question {
    return this.questions[id];
  }

  public getOpenAnswerId(id: string): string {
    return this.questions[id].relatedId;
  }

  public getCandidates(): CandidateDict {
    return this.candidates;
  }

  public getCandidatesAsList(): Candidate[] {
    let list = new Array<Candidate>();
    for (const id in this.candidates) {
      list.push(this.candidates[id]);
    }
    return list;
  }

  public getCandidate(id: string): Candidate | null {
    return id in this.candidates ? this.candidates[id] : null;
  }

  public getCandidatePortraitUrl(id: string): string {
    return `assets/images/candidate-portraits/${id}.jpg`;
  }

  /*
   * Get the average answer (decimal) to the question 
   * by all members (including all constituencies) of the respondent's party
   */
  public getPartyAverage(party: string, qId: string): number {
    if (qId in this.questions && party in this.questions[qId].partyAverages) {
      return this.questions[qId].partyAverages[party];
    } else {
      throw new Error(`Average value not found for party ${party} and question ${qId}.`);
    }
  }

  /*
   * NB! The Party objects do NOT contain the average answers
   * TODO: Collate party averages and parties
   */
  public getPartiesAsList(): Party[] {
    let list = new Array<Party>();
    for (const name in this.parties) {
      list.push(this.parties[name]);
    }
    return list;
  }

  public getParty(party: string): Party {
    return this.parties[party];
  }

  public getVoterAnswer(id: string): any {
    if ('voterAnswer' in this.questions[id] && this.questions[id].voterAnswer != null) {
      return this.questions[id].voterAnswer;
    } else {
      return null;
    }
  }
  
  public setVoterAnswer(id: string, value: number): void {
    if (id in this.questions) {
      this.questions[id].voterAnswer = value;
      this.writeCookie(id, value);
      // Emit event
      this.dataStatus.questions.next(DataStatus.Updated);
    }
  }

  public deleteVoterAnswer(id: string): void {
    if (id in this.questions) {
      delete this.questions[id].voterAnswer;
      this.deleteCookie(id);
      // Emit event
      this.dataStatus.questions.next(DataStatus.Updated);
    }
  }

  public countVoterAnswers(): number {
    return this.getVoterAnsweredQuestionIds().length;
  }

  public getVoterAnsweredQuestionIds(): string[] {
    let answered = [];
    for (const id in this.questions) {
      const q = this.questions[id];
      if ('voterAnswer' in q && 
          q.voterAnswer != null
          // && this.isRelevantQuestion(q)
          ) {
        answered.push(id);
      }
    }
    return answered;
  }

  public getVoterAnswers(): {[questionId: string]: number} {
    let answers = {};
    this.getVoterAnsweredQuestionIds().forEach( id => answers[id] = this.getVoterAnswer(id) );
    return answers;
  }

  /*
   * Order questions based on a naïve entropy heuristic
   * 
   * We use a precalculated polychoric correlation matrix to infer the amount of information
   * gained by answering each question and order the questions dynamically based on how much
   * they contribute towards resolving the residual uncertainty.
   *
   *  -- This assumes that any information based on correlation gained from subsequent answers 
   *     contributes fully to predicting unanswered questions. This, however, most likely
   *     isn't the case. Consider questions A, B and C, who are dependent on two latent variables
   *     x and y in this way: A = 0.5x * 0.5y, B = 1x, C = 1x. Thus, A will be strongly 
   *     correlated with both B and C, but after knowing B, no further information regarding A
   *     cannot be gained from knowing C.
   *  -- To cater for this possibility, we factor the correlation by residual entropy
   *     so as to discount the correlation the more we already know about a question.
   *
   *  TODO: Make this robust in an information theoretical sense
   */

  /* 
   * Dynamically calculate the residual entropy [0-1] for the given question using answered 
   * questions. As the heuristic is not commutative, we start work from the highest
   * correlation downwards. We can supply the answered questions as list so as to avoid making
   * consecutive calls to the getter.
   */
  public getResidualEntropy(questionId: string, answeredQuestions: string[] = null): number {

    // Completely correlated questions are not in the correlationMatrix, so we return 0 for them
    if (!(questionId in this.correlationMatrix))
      return 0;

    const answered: string[] = answeredQuestions == null ? this.getVoterAnsweredQuestionIds() : answeredQuestions;
    let   residue: number = 1;
    const correlations: number[] = answered.map(q => this.correlationMatrix[q][questionId]).sort().reverse();
    correlations.forEach(c => residue = residue * (1 - Math.abs(c) * residue));
    return residue;
  }

  /*
   * Calculate the effective total information [0-1] gained for getting an answer given question (row)
   */
  public getInformationValue(questionId: string, answeredQuestions: string[] = null): number {

    // Completely correlated questions are not in the correlationMatrix, so we return 0 for them
    if (!(questionId in this.correlationMatrix))
      return 0;

    const answered: string[] = answeredQuestions == null ? this.getVoterAnsweredQuestionIds() : answeredQuestions;
    let value: number = 0;
    for (const q in this.correlationMatrix[questionId]) {
      // To calculate the value, we get the difference between the current residual entropy and what it would
      // be if we had an answer for questionId, thus the concat
      let diff: number = this.getResidualEntropy(q, answered) - this.getResidualEntropy(q, answered.concat([questionId]));
      if (diff > 0) {
        value += diff;
      }
    }
    return value / Object.keys(this.correlationMatrix).length;
  }

  /*
   * Calculate total accumulated information [0...1]
   * Ie. sum of residual entropy / total entropy = length of (not totally correlated) questions
   */
  public getTotalInformation(): number {
    let total: number = 0;
    // Get this, so we can supply it later
    const answered = this.getVoterAnsweredQuestionIds();
    Object.keys(this.correlationMatrix).forEach(q => 
      total += 1 - this.getResidualEntropy(q, answered)
    );
    return total / Object.keys(this.correlationMatrix).length;
  }

  /*
   * Get an ordered list of questions based on information value
   * If all questions are answered, returns an empty list
   */
  public getInformationValueOrder(): {id: string, value: number }[] {
    let   qOrder: {id: string, value: number }[] = [];
    const answered = this.getVoterAnsweredQuestionIds();
    Object.keys(this.correlationMatrix)
      .filter(id => !answered.includes(id)) // Skip answered
      .map(id => {
        qOrder.push({
          id: id,
          value: this.getInformationValue(id, answered)
        });
      });
    // Sort by value desc.
    qOrder.sort((a, b) => a.value - b.value).reverse();
    return qOrder;
  }

  /*
   * Get questions based on agreement with the voter's answers
   */

  public getQuestionIdsByAgreement(candidateId: string, agrType: AgreementType): string[] {
    if (agrType === Likert.opinionUnknown) {
      const answered = this.getVoterAnsweredQuestionIds();
      return this.getLikertQuestionIds().filter( k => !answered.includes(k) );
    } else {
      return this.getVoterAnsweredQuestionIds().filter( k => Likert.doMatchAgreementType(this.questions[k].voterAnswer, this.candidates[candidateId][k], agrType) );
    }  
  }

  // Shorthands for getQuestionIdsByAgreement() returning Question lists 
  // The Questions are sorted by disagreement if the match is approximate
  public getAgreedQuestionsAsList(candidateId: string, approximateMatch: boolean = false, sortIfApproximate: boolean = true): Question[] {
    let questions = Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, approximateMatch ? Likert.mostlyAgree : Likert.agree)));
    return approximateMatch && sortIfApproximate ? questions.sort(this._getSorter(candidateId)) : questions;
  }
  // Sorted by disagreement desc
  public getDisagreedQuestionsAsList(candidateId: string, approximateMatch: boolean = false): Question[] {
    return Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, approximateMatch ? Likert.stronglyDisagree : Likert.disagree)))
             .sort(this._getSorter(candidateId));
  }
  public getUnansweredQuestionsAsList(candidateId: string): Question[] {
    return Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, Likert.opinionUnknown)));
  }

  // Return a function usable for sort
  private _getSorter(candidateId: string, descending: boolean = true): (a: Question, b: Question) => number {
    return (a, b) => { 
      let diff = Likert.getDistance(a.voterAnswer, this.candidates[candidateId][a.id]) -
                 Likert.getDistance(b.voterAnswer, this.candidates[candidateId][b.id]);
      return diff === 0 ? 
             this.compareQuestions(a, b) : 
             (descending ? -diff : diff);
    };
  }

  // Get the neutral answer, ie. 3, (used for missing answers when not inverting them)
  get neutralAnswer(): number {
    return Likert.neutralAnswer;
  }

  // Returns the maximally distant Likert answer with regard to the voter's answer to the given question
  public getInvertedVoterAnswer(id: string): number {
    let answer = this.getVoterAnswer(id);
    if (answer) {
      return Likert.invertAnswer(answer);
    } else {
      throw new Error(`No voter answer supplied for question ${id}.`);
    }
  }

  public getFavourites(): string[] {
    return this.favourites;
  }

  public getFavouriteCandidates(): Candidate[] {
    // We have to filter out nulls at the end as the user may have defined favourites 
    // from another constituency
    return this.getFavourites().map( id => this.getCandidate(id) ).filter( c => c != null );
  }

  public addFavourite(id: string): void {
    if (!this.favourites.includes(id)) {
      this.favourites.push(id);
      this.saveFavouritesToCookie();
      this.logEvent('favourites_add', {id});
    }
  }

  public removeFavourite(id: string): void {
    if (this.favourites.includes(id)) {
      this.favourites.splice(this.favourites.indexOf(id), 1);
      this.saveFavouritesToCookie();
      this.logEvent('favourites_remove', {id});
    }
  }

  public clearFavourites(): void {
    if (this.favourites.length) {
      this.favourites = [];
      this.saveFavouritesToCookie();
      this.logEvent('favourites_clear');
    }
  }

  public saveFavouritesToCookie(): void {
    if (this.favourites.length > 0) {
      this.writeCookie(COOKIE_FAVOURITES, this.favourites.join(COOKIE_VALUE_SEPARATOR));
    } else {
      this.deleteCookie(COOKIE_FAVOURITES);
    }
  }

  public setFavouritesFromCookie(): void {
    const favourites = this.readCookie(COOKIE_FAVOURITES)
    if (favourites) {
      this.favourites = favourites.split(COOKIE_VALUE_SEPARATOR).filter( id => id !== '' );
    }
  }

  get hasEnoughAnswersForTsne(): boolean {
    return this.countVoterAnswers() >= MIN_VALS_FOR_TSNE;
  }

  public writeCookie(name: string, value: any): void {
    // Save in cookie
    let expiry = new Date();
    expiry.setTime(expiry.getTime() + COOKIE_LIFE);
    // TODO Secure cookies don't currently work, maybe because of localhost?
    this.cookie.set(COOKIE_PREFIX + name, value.toString(), expiry, COOKIE_PATH, COOKIE_DOMAIN, false, 'Strict');
  }

  public readCookie(name: string): string | null {
    if (this.cookie.check(COOKIE_PREFIX + name)) {
      return this.cookie.get(COOKIE_PREFIX + name);
    } else {
      return null;
    }
  }

  public deleteCookie(name?: string): void {
    if (name != null) {
      this.cookie.delete(COOKIE_PREFIX + name, COOKIE_PATH, COOKIE_DOMAIN);
    }
  }

  public deleteAllCookies(): void {
    this.cookie.deleteAll(COOKIE_PATH, COOKIE_DOMAIN);
  }

  public async setMunicipalityFromCookie(): Promise<void> {
    const municipality = this.readCookie(COOKIE_MUNICIPALITY);
    if (municipality) {
      await this.setMunicipality(Number(municipality));
    }
    this.dataStatus.constituencyCookie.next(DataStatus.Ready);
  }

  public setAnswersFromCookie(): void {
    for (const id in this.questions) {
      const answer = this.readCookie(id);
      if (answer != null) {
        // Use Number as cookie values are stored as text
        this.setVoterAnswer(id, Number(answer));
      }
    }
  }

  public unsetVoterAnswers(): void {
    // TODO Check if necessary
    for (const id in this.questions) {
      delete this.questions[id].voterAnswer;
    }
    this.questions = null;
    this._constituencyId = null;
    this._municipalityId = null;
    this.dataStatus.questions.next(DataStatus.NotReady);
    this.dataStatus.candidates.next(DataStatus.NotReady);
    this.deleteAllCookies();
  }

  public initTsne(voterDisabled: boolean = false): void {
    // Prepare raw data for tSNE
    let tsneData = new Array<Array<number>>();
    let tsneCols = voterDisabled ? 
                   this.getLikertQuestionIds() :
                   this.getVoterAnsweredQuestionIds();
    this.tsneIds = new Array<string>();

    for (const id in this.candidates) {
      let d = [];
      tsneCols.forEach( q => {
        let v = this.candidates[id][q];
        // Convert missing values to max distance from voter if we are using voter answers
        if (this.isMissing(v, true)) {
          v = voterDisabled ? 
              this.neutralAnswer : 
              this.getInvertedVoterAnswer(q);
        }
        // Normalize
        // v = (v - 1) / 5;
        v = Number(v);
        if (isNaN(v))
          throw new Error(`Tsne initiated with a NaN value: ${this.candidates[id][q]} • candidate: ${id} • question: ${q}!`)
        d.push(v);
      } );
      tsneData.push(d);
      this.tsneIds.push(id);
    }
    // Add the voter as the last item
    if (!voterDisabled) {
      let voter = [];
      tsneCols.forEach( q => voter.push(Number(this.getVoterAnswer(q))) );
      tsneData.push(voter);
    }

    // Create tsne object and initialize
    this.tsne = new tsnejs.tSNE(this.tsneOptions);
    this.tsne.initDataRaw(tsneData);

    // Start calculating
    // TODO: make this nice and async instead of setInterval
    //       couldn't make async work nicely with the spinner
    // Once calculation is done, draw the map
    this.tsneIntervalRef = setInterval( () => {
      if (this.tsne.iter % 100 == 0) {
        this.progressChanged.emit(this.getTsneProgress());
      }
      for (let i = 0; i < this.tsneOptions.stepChunk; i++) {
        this.tsne.step();
        if (this.tsne.iter >= this.tsneOptions.maxChunks * this.tsneOptions.stepChunk) {
          clearInterval(this.tsneIntervalRef);
          this.updateTsne(voterDisabled);
        }
      }
    }, 1);
  }

  // Get minimum and maximum values from the arrays
  private _getBounds(vals: [number, number][], index: number = 0): number[] {
    if (!vals.length) {
      throw new Error("Argument vals cannot be empty");
    }
    let min: number = vals[0][index];
    let max: number = min;
    // Start from one as we already assigned [0]
    for (let j = 1; j < vals.length; j++) {
      if (vals[j][index] < min) {
        min = vals[j][index];
      } else if (vals[j][index] > max) {
        max = vals[j][index];
      }
    }
    return [min, max];
  }

  public updateTsne(voterDisabled: boolean = false): void {
    // Get solution
    const solution: [number, number][] = this.tsne.getSolution();

    // Find out min and max dimensions to normalize tSNE coordinates 
    const bounds: [number[], number[]] = [this._getBounds(solution, 0),
                                          this._getBounds(solution, 1)];
    
    // Set normalization scale based on the maximum dimension
    let max: number = 0;
    let scale: number;
    let voter: [number, number]; // This will only be used if not voterDisabled

    if (voterDisabled) {

      // Check both dims (i) to find the one with the maximum spread
      for (let i = 0; i < 2; i++) {
        let dist = bounds[i][1] - bounds[i][0];
        if (dist > max)
          max = dist;
      }

      scale = 1 / max;

    } else {

      // Set scale based on the greatest absolute distance from the voter in either direction
      // The last item in the solution is the voter (can't use pop as the solver needs the solution)

      voter = solution[solution.length - 1];

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          let dist = Math.abs(voter[i] - bounds[i][j]);
          if (dist > max)
            max = dist;
        }
      }

      // We need to multiply max by two as it's the max distance from the voter in either direction on either axis
      scale = 1 / (2 * max);

    }
    
    // Set tSNE coordinates
    for (let i = 0; i < solution.length; i++) {
      
      if (voterDisabled) {

        // Scale and normalise by subtracting the dimension's lower bound
        // and center the smaller dimension: 
        // max - (bounds[0/1][1] - bounds[0/1][0]) goes to zero for the bigger dim
        // and represents the difference for the smaller, of which we add half
        this.candidates[this.tsneIds[i]].tsne1 = (solution[i][0] - bounds[0][0] + (max - (bounds[0][1] - bounds[0][0])) / 2) * scale;
        this.candidates[this.tsneIds[i]].tsne2 = (solution[i][1] - bounds[1][0] + (max - (bounds[1][1] - bounds[1][0])) / 2) * scale;

      } else {

        // Skip the last one as that's the voter
        if (i === solution.length - 1)
          break;

        // Scale and center on voter
        this.candidates[this.tsneIds[i]].tsne1 = (solution[i][0] - voter[0]) * scale + 0.5;
        this.candidates[this.tsneIds[i]].tsne2 = (solution[i][1] - voter[1]) * scale + 0.5;

      }
    }

    // Calculate party centroids
    let parties: any = {};

    // Collect each partie's candidates' tsne values
    for (let c in this.candidates) {
      const cand = this.candidates[c];
      if (!(cand.party in parties))
        parties[cand.party] = new Array();
      parties[cand.party].push([cand.tsne1, cand.tsne2]);
    }

    // Init/reset this.parties
    this.parties = {};

    // Calculate coordinate averages and save in the parties property
    for (let p in parties) {
      const tsne1 = parties[p].reduce( (a, v) => a + v[0], 0 ) / parties[p].length;
      const tsne2 = parties[p].reduce( (a, v) => a + v[1], 0 ) / parties[p].length;
      this.parties[p] = {
        name: p,
        tsne1,
        tsne2,
      };
    }

    this.dataStatus.tsne.next(DataStatus.Ready);
  }

  // From 0 to 100
  public getTsneProgress(): number {
    if (this.tsne) {
      return Math.round(100 * this.tsne.iter / (this.tsneOptions.maxChunks * this.tsneOptions.stepChunk));
    } else {
      return 0;
    }
  }

  private initFilters(): void {

    // Clear filters
    this.filters = {};
    // Reset filter data for candidates
    // TODO: We are not emitting an update event for candidates, 
    // so if somebody already caught the first event, they won't know of the loss of filters...
    this.clearFilteredCandidates(true);

    // Create filters
    for (const f in this.filterOpts) {

      const filterType = this.filterOpts[f].type;
      const filter = new filterType(this.filterOpts[f].opts);

      // Extract unique values
      if (filterType === CandidateFilterQuestion) {
        filter.setValueGetter(() => new Set(this.getVoterAnsweredQuestionIds()));
      } else {
        for (let candidate in this.candidates) {
          filter.addValue(this.candidates[candidate][filter.key]);
        }
      }
      filter.rulesChanged.subscribe(f => this.applyFilter(f));
      this.filters[f] = filter;

    }

    this.dataStatus.filters.next(DataStatus.Ready);
  }

  private clearFilteredCandidates(suppressEvent: boolean = false): void {
    // TODO: We are not emitting an update event for candidates, 
    // so if somebody already caught the first event, they won't know of the loss of filters...
    for (let candidate in this.candidates) {
      this.candidates[candidate].filteredOut = null;
    }
    if (!suppressEvent) {
      this.dataStatus.filters.next(DataStatus.Updated);
    }
  }

  public applyFilter(filter: CandidateFilter): number {
    const numFiltered = filter instanceof CandidateFilterQuestion ?
                        filter.applyWithVoter(this.candidates, this.getVoterAnswers()) :
                        filter.apply(this.candidates);
    this.dataStatus.filters.next(DataStatus.Updated);
    return numFiltered;
  }

  public getFilters(): CandidateFilter[] {
    return Object.values(this.filters);
  }

  public getActiveFilterNames(): string[] {
    return Object.keys(this.filters).filter( f => this.filters[f].active );
  }

  get hasActiveFilters(): boolean {
    return this.getFilters().filter( f => f.active ).length > 0;
  }

  /*
   * Set the party filter to party or clear the filter if no argument given
   */
  public setPartyFilter(party: string = null, exclude: boolean = false): void {

    const filter = this.filters.party as CandidateFilterSimple;

    if (party !== null) {
      if (exclude) {
        filter.exclude(party);
      } else {
        // This will in effect exclude all other parties
        filter.require(party);
      }
    } else {
      // Clear existing party filters
      filter.clearRules();
    }

  }

  get hasPartyFilter(): boolean {
    return this.filters.party.active;
  }

  /*
   * Check if party is one required by the filter
   * Optionally check if this is the only active party
   */
  public partyIsRequired(party: string, isTheOnlyActive: boolean = false): boolean {

    if (!this.hasPartyFilter)
      return false;

    const isActive =  (this.filters.party as CandidateFilterSimple).isRequired(party);
    return isTheOnlyActive ? (isActive && (this.filters.party as CandidateFilterSimple).getRequired().length === 1) : isActive;
  }

  public partyIsExcluded(party: string): boolean {
    return (this.filters.party as CandidateFilterSimple).isExcluded(party);
  }

  public logEvent(eventName: string, eventParams: any = {}): void {
    this.database.logEvent(eventName, eventParams);
  }

  /*
   * Return a dump of the matcher state for feedback
   */
  get state(): any {
    return {
      municipality: this._municipality,
      municipalityId: this._municipalityId,
      constituency: this._constituency,
      constituencyId: this._constituencyId,
      // dataStatus: this.dataStatus, // No easy way to dump this
      activeFilters: this.getActiveFilterNames(),
    }
  }
}