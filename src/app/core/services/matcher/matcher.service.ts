import { 
  Injectable, 
  EventEmitter
} from '@angular/core';
import { 
  CookieService 
} from 'ngx-cookie-service';
import { 
  BehaviorSubject 
} from 'rxjs';
import { 
  filter 
} from 'rxjs/operators';

import {
  CategoryDict,
  Candidate,
  CandidateDict,
  Party,
  PartyDict,
  ConstituencyDict,
  DatabaseService,
  MunicipalityDict,
  AgreementType,
  Question,
  QuestionDict,
  QuestionNumeric,
  CandidateOptions,
  Municipality,
  QuestionPreferenceOrder,
  QuestionSingleNumber
} from '../database';
import { 
  PcaProjector 
} from './data-projector/';
// import { TsneProjector } from './data-projector/';

import { 
  CandidateFilter,
  CandidateFilterLogicOperator,
  CandidateFilterSimple,
  CandidateFilterNumberRange,
  CandidateFilterMultiQuestion
} from './candidate-filter';

export const COOKIE_PREFIX = "CM-VoterAnswer-";
export const COOKIE_MUNICIPALITY = "Municipality";
export const COOKIE_FAVOURITES = "Favourites";
export const COOKIE_VALUE_SEPARATOR = ",";
export const COOKIE_PATH = "/";
export const COOKIE_DOMAIN = null;
export const COOKIE_LIFE = 1000 * 60 * 60 * 24 * 7; // Cookie lifetime in millisecs (the last number is day)
export const MAX_MISSING_VALS = 10; // Set to 0 or greater to cull candidates based on number of missing vals, use -1 to include all candidates
export const NONMISSING_CANDIDATE_MAX_MISSING_VALS = 9; // The max number of missing vals before a candidate is flagged as missing, set to -1 to mark none
export const MIN_VALS_FOR_MAPPING = 1; // We are enabling tSNE for the first answer

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
  private _municipalityId: string;
  private _constituency: string;
  private _constituencyId: string;
  private _voterDisabled: boolean = false;
  public questions: QuestionDict = {};
  public correlationMatrix: any;
  public categories: CategoryDict;
  public candidates: CandidateDict;
  public parties: PartyDict;
  public municipalities: MunicipalityDict;
  public constituencies: ConstituencyDict;
  public favourites: string[] = new Array<string>();
  public filterOpts: {
    [name: string]: { 
      type: any, 
      questionKey?: string,
      opts: any 
    }
  } = {
    question: {
      type: CandidateFilterMultiQuestion,
      opts: {
        title: 'Kynnyskysymyksen perusteella',
        description: 'Näytä vain ehdokkaat, jotka ovat samaa tai lähes samaa mieltä kanssasi valituista kysymyksistä.',
        multipleValues: false,
      }
    },
    age: {
      type: CandidateFilterNumberRange,
      questionKey: 'Q59',
      opts: {
        title: 'Iän perusteella',
        unitName: 'vuotta',
        // minDescription: 'Ikä vähintään', 
        // maxDescription: 'Ikä enintään', 
        multipleValues: false,
      }
    },
    gender: {
      type: CandidateFilterSimple,
      questionKey: 'Q63',
      opts: {
        title: 'Sukupuolen perusteella',
        multipleValues: false,
      }
    },
    party: {
      type: CandidateFilterSimple,
      opts: {
        property: 'partyName',
        title: 'Puolueen perusteella',
        multipleValues: false,
      }
    },
    motherTongue: {
      type: CandidateFilterSimple,
      questionKey: 'Q64',
      opts: {
        title: 'Äidinkielen perusteella',
        multipleValues: false,
      }
    },
    education: {
      type: CandidateFilterSimple,
      questionKey: 'Q66',
      opts: {
        title: 'Koulutuksen perusteella',
        multipleValues: false,
      }
    },
    politicalExperience: {
      type: CandidateFilterSimple,
      questionKey: 'Q68',
      opts: {
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
    mapping:            new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    filters:            new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    constituencyCookie: new BehaviorSubject<DataStatus>(DataStatus.NotReady),
  };
  // Shorthands for the dataStatuses
  public constituencyDataReady =   this.dataStatus.constituencies.pipe(filter(     t => t !== DataStatus.NotReady ));
  public questionDataReady =       this.dataStatus.questions.pipe(filter(          t => t !== DataStatus.NotReady ));
  public questionDataUpdated =     this.dataStatus.questions.pipe(filter(          t => t === DataStatus.Updated ));
  public candidateDataReady =      this.dataStatus.candidates.pipe(filter(         t => t !== DataStatus.NotReady ));
  public mappingDataReady =        this.dataStatus.mapping.pipe(filter(            t => t === DataStatus.Ready ));
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
    this.questionDataUpdated.subscribe( () => this.dataStatus.mapping.next(DataStatus.NotReady) );
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

  // Getters and setters
  // get questions(): QuestionDict {
  //   // if (! this._questions)
  //   //   throw Error("Constituency must be defined before getting Questions");
  //   return this._questions;
  // }

  // set questions(value: QuestionDict) {
  //   this._questions = value;
  // }

  get questionsAsList(): Question[] {
    return Object.values(this.questions);
  }


  get municipality(): string {
    return this._municipality;
  }

  get municipalityId(): string {
    return this._municipalityId;
  }

  get constituency(): string {
    return this._constituency;
  }

  get constituencyId(): string {
    return this._constituencyId;
  }

  get voterDisabled(): boolean {
    return this._voterDisabled;
  }

  set voterDisabled(value: boolean) {
    // If voterDisabled changes, we need to mark tsne as not ready
    if (this.voterDisabled !== value) {
      this._voterDisabled = value;
      this.dataStatus.mapping.next(DataStatus.NotReady);
    }
  }

  public getConstituencyNameByMunicipalityId(id: string): string {
    if (id in this.municipalities) {
      return this.getConstituencyNameById(this.municipalities[id].constituencyId);
    } else {
      throw new Error(`Municipality id '${id}' not found.`);
    }
  }

  public getConstituencyNameById(id: string): string {
    if (id in this.constituencies) {
      return this.constituencies[id].name;
    } else {
      throw new Error(`Constituency id '${id}' not found.`);
    }
  }

  public getMunicipalitiesAsList(): Municipality[] {
    return Object.values(this.municipalities);
  }

  public async setMunicipality(id: string): Promise<void> {

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

  private async setConstituency(id: string): Promise<void> {

    // Reset downstream data statuses
    this.dataStatus.questions.next(DataStatus.NotReady);
    this.dataStatus.candidates.next(DataStatus.NotReady);
    this.dataStatus.mapping.next(DataStatus.NotReady);
    this.dataStatus.filters.next(DataStatus.NotReady);

    // This could be done earlier, but for consistency let's do it only now,
    // as in theory the categories might be dependent on the constituency
    this.categories = await this.database.getCategories();
        
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
    this.readAnswersFromCookie();

    // Import parties
    this.parties = await this.database.getParties();

    // Import candidate data
    this.candidates = await this.database.getCandidates(id);

    // Cull parties not present in this constituency from parties
    // TODO: Check if this might be unwanted
    let partiesPresent = new Set<string>();
    for (const id in this.candidates)
      partiesPresent.add(this.candidates[id].party.id);
    for (const id in this.parties)
      if (!partiesPresent.has(id))
        delete this.parties[id];
        
    // DEBUG / TEST / REMOVE
    // Multiply candidates to test performance
    // const qq = this.getAnswerableQuestions();
    // const perturbProb = 0.25; // 0.5;
    // const randomProb = 0.1;
    // const multiplierRange = [0.25, 6];
    // let multiplier = multiplierRange[0] + Math.random() * (multiplierRange[1] - multiplierRange[0]);
    // if (multiplier > 1) multiplier = Math.round(multiplier);
    // if (multiplier !== 1) {
    //   for (const candidate in this.candidates) {
    //     // Skip randomly if multiplier < 1
    //     if (multiplier < 1 && Math.random() > multiplier) {
    //       delete(this.candidates[candidate]);
    //       continue;
    //     }
    //     // Otherwise create new objects
    //     const c = this.candidates[candidate];
    //     for (let i = 0; i < multiplier; i++) {
    //       // Copy props
    //       let {
    //         id, number, surname, givenName, constituencyId, partyId, selected, detailsLoader, constituencyReference, partyReference,
    //         ...rest
    //       } = c;
    //       const a = {...c.basicQuestions}
    //       // Create faux replies
    //       qq.forEach(q => {
    //         const lid = q.id;
    //         const rand = Math.random();
    //         let val = c.getAnswer(lid);
    //         if (rand < randomProb) {
    //           // Full random
    //           // Value should be 1, 2, 4 or 5
    //           if (q instanceof QuestionPreferenceOrder) {
    //             // Do nothing
    //           } else {
    //             val = Math.ceil(Math.random() * ((q as QuestionSingleNumber).maxAnswer - 1));
    //             if (val >= q.neutralAnswer) val++;
    //           }
    //         } else if (rand < perturbProb && !(q instanceof QuestionPreferenceOrder)) {
    //           // Perturb by one pt
    //           val += [1,4].includes(val) ? 1 : -1;
    //         }
    //         a[lid] = val;
    //       });
    //       id = id + '_' + i
    //       const o: CandidateOptions = {
    //         id, number, surname, givenName, constituencyId, partyId, selected, detailsLoader, constituencyReference, partyReference,
    //         basicQuestions: a
    //       }
    //       const n = new Candidate(o);
    //       this.candidates[id] = n;
    //     }
    //   }
    // }
    // console.log("TEST: Added candidates for testing! Before culling, N = " + Object.keys(this.candidates).length);
    
    // console.log(this.candidates);
    // END: DEBUG / TEST / REMOVE

    // Cull candidates with too many missing values
    // and flag candidates with missing values above the threshold
    if (MAX_MISSING_VALS > -1 || NONMISSING_CANDIDATE_MAX_MISSING_VALS > -1) {

      let qq = this.getAnswerableQuestions();
 
      for (const id in this.candidates) {

        let missing = qq.filter(q => q.isMissing(this.candidates[id].getAnswer(q))).length;

        if (MAX_MISSING_VALS > -1 && missing > MAX_MISSING_VALS)
          delete this.candidates[id];
        else if (NONMISSING_CANDIDATE_MAX_MISSING_VALS > -1 && missing > NONMISSING_CANDIDATE_MAX_MISSING_VALS)
          this.candidates[id].missing = true;
      }
    }

    // Add ids to Candidate objects themselves
    for (const id in this.candidates)
      this.candidates[id].id = id;

    // Emit change events
    this.dataStatus.questions.next(DataStatus.Ready);
    this.dataStatus.candidates.next(DataStatus.Ready);
  }

  // REM
  // For convenience
  // // NB. We need a different heuristic for checking Likert values
  // public isMissing(value: any, likert: boolean = false): boolean {
  //   return (likert ? Likert : MissingValue).isMissing(value);
  // }

  // // We already filter these when fetching from Firebase
  // public isRelevantQuestion(q: Question): boolean {
  //   return !q.dropped;
  //          && (!q.constituencyId || q.constituencyId === this.constituencyId);
  // }

  public getQuestionsByIds(ids: string[]): QuestionDict {
    if (! this.questions) {
      throw Error("Constituency must be defined before getting Questions");
    }
    let dict: QuestionDict = {};
    ids.forEach( id => dict[id] = this.questions[id] );
    return dict;
  }

  public getAnswerableQuestionIds(): string[] {
    return this.getAnswerableQuestions().map(q => q.id);
  }
 
  public getAnswerableQuestions(): QuestionNumeric[] {
    return Object.values(this.questions).filter(q => q instanceof QuestionNumeric) as QuestionNumeric[];
  }

  public compareQuestions(a: Question, b: Question): number {
    let cDiff = a.category.order - b.category.order;
    if (cDiff !== 0)
      return cDiff;
    else
      return a.id < b.id ? -1 : 1;
  }

  public getQuestion(id: string): Question {
    return this.questions[id];
  }

  public getCandidates(): CandidateDict {
    return this.candidates;
  }

  public getCandidatesAsList(): Candidate[] {
    return Object.values(this.candidates);
  }

  public getCandidate(id: string): Candidate | null {
    return id in this.candidates ? this.candidates[id] : null;
  }

  public getCandidatePortraitUrl(id: string): string {
    return `assets/images/candidate-portraits/${id}.jpg`;
  }

  // REM
  // /*
  //  * Get the average answer (decimal) to the question 
  //  * by all members (including all constituencies) of the respondent's party
  //  */
  // public getPartyAverage(party: string, qId: string): number {
  //   if (qId in this.questions && party in this.questions[qId].partyAverages) {
  //     return this.questions[qId].partyAverages[party];
  //   } else {
  //     throw new Error(`Average value not found for party ${party} and question ${qId}.`);
  //   }
  // }

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

  public getVoterAnswer(question: Question): any {
    if (question instanceof QuestionNumeric && question.voterAnswer != null)
      return question.voterAnswer;
    else
      return null;
  }
  
  public setVoterAnswer(question: Question, value: number | number[]): void {
    if (question instanceof QuestionNumeric) {
      question.voterAnswer = value;
      this.writeCookie(question.id, question.convertAnswerToString());
      // Emit event
      this.dataStatus.questions.next(DataStatus.Updated);
    }
  }

  public deleteVoterAnswer(id: string): void {
    let question = this.questions[id];
    if (question && question instanceof QuestionNumeric) {
      delete question.voterAnswer;
      this.deleteCookie(id);
      // Emit event
      this.dataStatus.questions.next(DataStatus.Updated);
    }
  }

  public countVoterAnswers(): number {
    return this.getVoterAnsweredQuestions().length;
  }

  public getVoterAnsweredQuestions(): QuestionNumeric[] {

    return Object.values(this.questions).filter(q => q instanceof QuestionNumeric && q.voterAnswer != null) as QuestionNumeric[];
  }

  public getVoterAnsweredQuestionIds(): string[] {
    return this.getVoterAnsweredQuestions().map(q => q.id);
  }

  public getVoterAnswers(): {[questionId: string]: number} {
    let answers = {};
    this.getVoterAnsweredQuestions().forEach( q => answers[q.id] = q.voterAnswer );
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
  public getResidualEntropy(questionId: string, answeredQuestions: string[]): number {

    // Completely correlated questions are not in the correlationMatrix, so we return 0 for them
    if (!(questionId in this.correlationMatrix))
      return 0;

    const answered: string[] = answeredQuestions || this.getVoterAnsweredQuestionIds();
    let residue: number = 1;
    const correlations: number[] = answeredQuestions.filter(q => q in this.correlationMatrix).map(q => this.correlationMatrix[q][questionId]).sort().reverse();
    correlations.forEach(c => residue = residue * (1 - Math.abs(c) * residue));
    return residue;
  }

  /*
   * Calculate the effective total information [0-1] gained for getting an answer given question (row)
   */
  public getInformationValue(questionId: string): number {

    // Completely correlated questions are not in the correlationMatrix, so we return 0 for them
    if (!(questionId in this.correlationMatrix))
      return 0;

    const answered: string[] = this.getVoterAnsweredQuestionIds();
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
          value: this.getInformationValue(id)
        });
      });
    // Sort by value desc.
    qOrder.sort((a, b) => a.value - b.value).reverse();
    return qOrder;
  }

  // Shorthands for getQuestionIdsByAgreement() returning Question lists 
  // The Questions are sorted by disagreement if the match is approximate
  public getAgreedQuestionsAsList(candidate: Candidate, approximateMatch: boolean = false, sortIfApproximate: boolean = true): QuestionNumeric[] {
    const questions = this.getAnswerableQuestions().filter(q =>
      approximateMatch ?
      q.doLooselyAgree(q.voterAnswer, candidate.getAnswer(q)) :
      q.doStrictlyAgree(q.voterAnswer, candidate.getAnswer(q))
    );
    return approximateMatch && sortIfApproximate ? questions.sort(this._getSorter(candidate)) : questions;
  }
  
  // Sorted by disagreement desc
  public getDisagreedQuestionsAsList(candidate: Candidate, approximateMatch: boolean = false): QuestionNumeric[] {
    return this.getAnswerableQuestions().filter(q =>
      approximateMatch ?
      q.doLooselyDisagree(q.voterAnswer, candidate.getAnswer(q)) :
      q.doStrictlyDisagree(q.voterAnswer, candidate.getAnswer(q))
    ).sort(this._getSorter(candidate));
  }

  public getUnansweredQuestionsAsList(candidate: Candidate): QuestionNumeric[] {
    return  this.getAnswerableQuestions().filter(q => q.voterAnswer == null);
  }

  /*
   * Return a function usable for sort
   * TODO: the distance for Likert7 questions is higher as they are not normalized.
   */
  private _getSorter(candidate: Candidate, descending: boolean = true): (a: QuestionNumeric, b: QuestionNumeric) => number {
    return (a: QuestionNumeric, b: QuestionNumeric) => { 
      let diff = a.getDistance(a.voterAnswer, candidate.getAnswer(a)) -
                 b.getDistance(b.voterAnswer, candidate.getAnswer(b));
      return diff === 0 ? 
             this.compareQuestions(a, b) : 
             (descending ? -diff : diff);
    };
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

  get hasEnoughAnswersForMapping(): boolean {
    return this.countVoterAnswers() >= MIN_VALS_FOR_MAPPING;
  }

  public writeCookie(name: string, value: string): void {
    // Save in cookie
    let expiry = new Date();
    expiry.setTime(expiry.getTime() + COOKIE_LIFE);
    // TODO Secure cookies don't currently work, maybe because of localhost?
    this.cookie.set(COOKIE_PREFIX + name, value, expiry, COOKIE_PATH, COOKIE_DOMAIN, false, 'Strict');
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
      await this.setMunicipality(municipality);
    }
    this.dataStatus.constituencyCookie.next(DataStatus.Ready);
  }

  public readAnswersFromCookie(): void {
    for (const q of this.getAnswerableQuestions()) {
      const answer = this.readCookie(q.id);
      if (answer != null)
        // Use Numbers as cookie values are stored as text
        this.setVoterAnswer(q, q.parseAnswerFromString(answer));
    }
  }

  public unsetVoterAnswers(): void {
    this.getVoterAnsweredQuestions().forEach(q => q.unsetVoterAnswer());
    this.questions = {};
    this._constituencyId = null;
    this._municipalityId = null;
    this.dataStatus.questions.next(DataStatus.NotReady);
    this.dataStatus.candidates.next(DataStatus.NotReady);
    this.deleteAllCookies();
  }

  public initMapping(): void {

    // Prepare raw data for mapping
    const data = new Array<Array<number>>();
    const questions = this.voterDisabled ? 
                      this.getAnswerableQuestions() :
                      this.getVoterAnsweredQuestions();
    const candidates = this.getCandidatesAsList();

    // Treat values
    for (const c of candidates) {
      let d = [];
      questions.forEach(q => {

        let answer: number | number[] = c.getAnswer(q);

        if (q.isMissing(answer))
          answer = this.voterDisabled ? 
                   q.neutralAnswer : 
                   q.getInvertedVoterAnswer();

        answer = q.normalizeValue(answer)

        // QuestionPreferenceOrder values are converted to a number of pairwise combinations
        if (Array.isArray(answer))
          d.push(...answer);
        else
          d.push(answer);

      });
      data.push(d);
    }

    // Add the voter as the last item
    // TODO:  Move voterAnswer away from Questions and convert Voter to a subclass of Candidate
    if (!this.voterDisabled) {
      const voter = [];
      questions.forEach(q => {
        let answer: number | number[] = q.normalizeValue(q.voterAnswer);
        if (Array.isArray(answer))
          voter.push(...answer);
        else
          voter.push(answer);
      });
      data.push(voter);
    }

    // Call projector service,
    // NB. with PCA the progress emitter is not used
    const projector = new PcaProjector();
    projector.project(data, this.voterDisabled, (progress) => {
      this.progressChanged.emit(progress);
    }).then((coordinates) => {
      this.setCandidateCoordinates(candidates, coordinates);
      this.placeParties();
      this.dataStatus.mapping.next(DataStatus.Ready);
    });
  }

  public setCandidateCoordinates(candidates: Candidate[], coordinates: [number, number][]): void {
    for (let i = 0; i < candidates.length; i++) {
      candidates[i].projX = coordinates[i][0];
      candidates[i].projY = coordinates[i][1];
    }
    this.dataStatus.mapping.next(DataStatus.Updated);
  }

  public placeParties(): void {

    // Calculate party centroids
    let parties: any = {};

    // Collect each partie's candidates' tsne values
    for (let c in this.candidates) {
      const cand = this.candidates[c];
      if (!(cand.partyId in parties))
        parties[cand.partyId] = new Array();
      parties[cand.partyId].push([cand.projX, cand.projY]);
    }

    // Calculate coordinate averages and save in the parties property
    for (let p in parties) {
      const projX = parties[p].reduce( (a, v) => a + v[0], 0 ) / parties[p].length;
      const projY = parties[p].reduce( (a, v) => a + v[1], 0 ) / parties[p].length;
      this.parties[p].projX = projX;
      this.parties[p].projY = projY;
    }

    this.dataStatus.mapping.next(DataStatus.Updated);
  }

  private initFilters(): void {

    // Clear filters
    this.filters = {};
    // Reset filter data for candidates
    // TODO: We are not emitting an update event for candidates, 
    // so if somebody already caught the first event, they won't know of the loss of filters...
    this.clearFilteredCandidates(true);

    const candidates = this.getCandidatesAsList();

    // Create filters
    for (const f in this.filterOpts) {

      // QuestionKey is required for basic filters, for property-based ones
      // the prop name is in the opts already. For CandidateFilterMultiQuestion
      // none is required.
      const opts = {...this.filterOpts[f].opts};
      if (this.filterOpts[f].questionKey != null)
        opts.question = this.questions[this.filterOpts[f].questionKey];

      const filterType = this.filterOpts[f].type;
      const filter = new filterType(opts);

      // Extract unique values
      if (filterType === CandidateFilterMultiQuestion)
        filter.setValueGetter(() => new Set(this.getVoterAnsweredQuestions()));
      else
        for (const candidate of candidates)
          filter.addValue(opts.question ? 
                          candidate.getAnswer(opts.question) : 
                          candidate[opts.property]);

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
    const numFiltered = filter.apply(this.candidates);
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