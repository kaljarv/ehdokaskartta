import { Injectable, EventEmitter, Type } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import * as tsnejs from '../tsne/tsne.js';

export const QUESTION_LIKERT = "Likert";
export const QUESTION_OPEN = "Open";
export const MISSING_VALS = [null, "-", "", "En halua kertoa"];
export const MAX_MISSING_VALS = -1; // Set to 0 or greater to cull candidates based on number of missing vals
export const COOKIE_PREFIX = "CM-VoterAnswer-";
export const COOKIE_MUNICIPALITY = "Municipality";
export const COOKIE_PATH = "/";
export const COOKIE_DOMAIN = null;
export const MIN_VALS_FOR_TSNE = 5;
export const AGREEMENT_AGREE = "agree";
export const AGREEMENT_DISAGREE = "disagree";
export const AGREEMENT_VOTER_UNKNOWN = "voterOpinionUnknown";
export const PARTY_INDEPENDENT = "Sitoutumaton";

export type AgreementType = "agree" | "disagree" | "voterOpinionUnknown"; // See consts above

export interface Question {
  id?: string,
  text?: string,
  topic?: string,
  category?: string,
  type?: string, // See QUESTION_LIKERT and QUESTION_OPEN
  relatedId?: string,
  dropped?: boolean,
  precinctId?: number,
  voterAnswer?: number
}
export type QuestionDict = { [id: string]: Question }

export interface Candidate {
  id?: string, // The unique id = precinctId_number, also used as the key in the dict
  number: number,
  surname: string,
  givenName: string,
  precinctId: number,
  party: string,
  selected: number,
  tsne1?: number,
  tsne2?: number,
  filteredOut?: Set<CandidateFilter>,
  [questionN: string]: any // Additionally has props Q1...Q209 corresponding to answers to questions
}
export type CandidateDict = { [id: string]: Candidate }

export interface QuestionAverageDict {
  [questionId: string]: {
    [partyName: string]: number
  }
}

export enum DataStatus {
  NotReady,
  Ready,
  Updated
}

export const PARTY_STRINGS = {
  "genitive":{
    "Kokoomus":                               "Kokoomuksen",
    "Suomen Kommunistinen Puolue":            "Suomen Kommunistisen Puolueen",
    "Perussuomalaiset":                       "Perussuomalaisten",
    "RKP":                                    "RKP:n",
    "Seitsem\u00e4n t\u00e4hden liike":       "Seitsem\u00e4n t\u00e4hden liikkeen",
    "SDP":                                    "SDP:n",
    "Kansalaispuolue":                        "Kansalaispuolueen",
    "Kommunistinen Ty\u00f6v\u00e4enpuolue":  "Kommunistisen Ty\u00f6v\u00e4enpuolueen",
    "Feministinen puolue":                    "Feministisen puolueen",
    "Keskusta":                               "Keskustan",
    "Kristillisdemokraatit":                  "Kristillisdemokraattien",
    "Itsen\u00e4isyyspuolue":                 "Itsen\u00e4isyyspuolueen",
    "Sitoutumaton":                           "Sitoutumattomien",
    "Sininen tulevaisuus":                    "Sinisen tulevaisuuden",
    "Vasemmistoliitto":                       "Vasemmistoliiton",
    "Suomen Kansa Ensin":                     "Suomen Kansa Ensin -puolueen",
    "Vihre\u00e4t":                           "Vihreiden",
    "Piraattipuolue":                         "Piraattipuolueen",
    "Liberaalipuolue":                        "Liberaalipuolueen",
    "El\u00e4inoikeuspuolue":                 "El\u00e4inoikeuspuolueen",
    "Liike Nyt":                              "Liike Nyt -puolueen",
    "Kansanliike Suomen Puolesta":            "Kansanliikkeen Suomen Puolesta",
  },
}



/**********************************************************************
 * CANDIDATE FILTERS
 **********************************************************************/

export interface CandidateFilterOptions {
  key: string,
  description?: string,
  multipleValues?: boolean,
  multipleValueSeparator?: string,
  [extraOptionName: string]: any
}
export enum CandidateFilterLogicOperator {
  And,
  Or,
}
export const MISSING_FILTER_VAL = {
  toString: () => '– Ei vastausta –',
  isMissing: true
}

/* 
 * Base class for filters to filter out candidates
 */ 
export class CandidateFilter {
  public key: string;
  public description: string;
  // Multiple values means a candidate may have multiple values for the datum filtered
  public multipleValues: boolean = false;
  public multipleValueSeparator: string = ',';
  public multipleValueLogicOperator: CandidateFilterLogicOperator = CandidateFilterLogicOperator.Or;
  public rulesChanged$: EventEmitter<CandidateFilter> = new EventEmitter<CandidateFilter>();
  protected _values: Set<any> = new Set();
  protected _rules: { [name: string]: any } = {};
  protected _supressRulesChanged = false;

  constructor(
    opts?: CandidateFilterOptions,
    values?: any[]) {
    if (opts) {
      for (let key in opts) {
        this[key] = opts[key];
      }
    }
    if (values) {
      this.addValue(values);
    }
  }
  // Methods that are usually be overriden by subclasses

  // Return true if this has some filters set
  get active(): boolean {
    return false;
  }

  // Convert value to one used by filter (called after checking for missing answers)
  protected _processType(value: any): any {
    return value;
  }

  // Sorting function
  protected _sort(a: any, b: any): number {
    return a - b;
  }

  // Called for each rule when clearing, default expects rules to be Sets
  protected _clearRule(rule: Set<any>): any {
    rule.clear();
    return rule;
  }

  // Called with the processed value after the value is added
  protected _onValueAdded(value: any): void {
  }

  // Return true if the value or values in case of a multivalue filter matches
  public match(value: any): boolean {
    return true;
  }

  // Other methods
  
  public getValues(dontSort: boolean = false): any[] {
    return dontSort ? 
           Array.from(this._values) : 
           Array.from(this._values).sort((a, b) => {
             // Sort missing values to the end
             if (a === b) {
               return 0;
             } else if (a === MISSING_FILTER_VAL) {
               return 1;
             } else if (b === MISSING_FILTER_VAL) {
               return -1;
             } else {
               return this._sort(a, b);
             }
           });
  }

  public isMissing(value: any): boolean {
    return value === MISSING_FILTER_VAL;
  }

  get hasMissing(): boolean {
    return this._values.has(MISSING_FILTER_VAL);
  }

  protected _process(value: any): any {
    return MISSING_VALS.includes(value) ? MISSING_FILTER_VAL : this._processType(value);
  }

  public addValue(...values: any): void {
    values.forEach(v => {
      let vArr = [v];
      if (this.multipleValues) {
        vArr = v.split(this.multipleValueSeparator);
      }
      vArr.forEach(v2 => {
        const vP = this._process(v2);
        this._values.add(vP);
        this._onValueAdded(vP);
      });
    });
  }
  public deleteValue(...values: any): void {
    values.forEach(v => {
      const vP = this._process(v);
      this._values.delete(vP);
      Object.values(this._rules).forEach(r => r.delete(vP));
    });
  }
  public clear(): void {
    this._values.clear();
    this.clearRules();
    this._changed();
  }
  public clearRules(): void {
    for (let r in this._rules) {
      this._rules[r] = this._clearRule(this._rules[r]);
    }
    this._changed();
  }

  // This is called by apply and it calls match for all values if filter allows multiple values
  // or otherwise just calls match for the singleton
  public matchMultiple(unprocessedValue: any): boolean {
    if (this.multipleValues) {

      const vArr = unprocessedValue.split(this.multipleValueSeparator);
      // For Or any of the values must be true, otherwise return false
      // For And none of the values can be false, if so, return true
      for (let i = 0; i < vArr.length; i++) {
        let r = this.match(this._process(vArr[i]));
        if (r && this.multipleValueLogicOperator === CandidateFilterLogicOperator.Or) {
          return true;
        } else if (!r && this.multipleValueLogicOperator === CandidateFilterLogicOperator.And) {
          return false;
        }
      }

      switch (this.multipleValueLogicOperator) {
        case CandidateFilterLogicOperator.Or:
          return false;
        case CandidateFilterLogicOperator.And:
          return true;
        default:
          throw new Error(`Unimplemented CandidateFilterLogicOperator ${this.multipleValueLogicOperator}.`);
      }

    } else {
      return this.match(this._process(unprocessedValue));
    }
  }

  // NB. This expects a dictionary
  public apply(data: {[id: string]: {}}, filteredKey: string = 'filteredOut') {
    let count = 0;
    // Apply test to all items
    for (const id in data) {
      let fOut = (filteredKey in data[id]) ? data[id][filteredKey] : null;
      if (this.active && !this.matchMultiple(data[id][this.key])) {
        // We save the applied filter in the filteredOut prop
        if (fOut) {
          fOut.add(this);
        } else {
          fOut = new Set<CandidateFilter>([this]);
        }
        count++;
      } else if (fOut) {
        // Filter matched, so we remove this from the filters
        fOut.delete(this);
        // If no filters apply remove the set altogether
        if (!fOut.size) fOut = null;
      }
      data[id][filteredKey] = fOut;
    }
    return count;
  }

  public supressRulesChanged(): void {
    this._supressRulesChanged = true;
  }
  public revertRulesChanged(): void {
    this._supressRulesChanged = false;
    this._changed();
  }
  protected _changed(): void {
    if (!this._supressRulesChanged) this.rulesChanged$.emit(this);
  }
}


/*
 * Basic string filter that implements require and exclude
 */
export class CandidateFilterBasic extends CandidateFilter {
  protected _rules = {
    required: new Set(),
    excluded: new Set(),
  }

  constructor(...args) {
    super(...args);
  }

  // Overrides

  protected _sort(a: any, b: any): number {
    const aLc = a.toLocaleLowerCase('fi-FI');
    const bLc = b.toLocaleLowerCase('fi-FI');
    return aLc < bLc ? -1 : (aLc > bLc ? 1 : 0);
  }

  get active(): boolean {
    return (this._rules.required.size + this._rules.excluded.size) > 0;
  }

  public match(value: any): boolean {
    if (this._rules.required.size && this._rules.excluded.size) {
      return this.isRequired(value) && !this.isExcluded(value);
    } else if (this._rules.required.size) {
      return this.isRequired(value);
    } else {
      return !this.isExcluded(value);
    }
  }

  // New methods

  public isRequired(value: any): boolean {
    return this._rules.required.has(value);
  }
  public isExcluded(value: any): boolean {
    return this._rules.excluded.has(value);
  }
  public getRequired(): any[] {
    return Array.from(this._rules.required);
  }
  public getExcluded(): any[] {
    return Array.from(this._rules.excluded);
  }
  public exclude(...values: any): void {
    values.forEach(v => {
      this._rules.excluded.add(this._process(v));
      this._rules.required.delete(this._process(v));
    });
    this._changed();
  }
  public dontExclude(...values: any): void {
    values.forEach(v => this._rules.excluded.delete(this._process(v)));
    this._changed();
  }
  public setExcluded(...values: any): void {
    this._rules.excluded.clear();
    this.exclude(values);
  }
  public require(...values: any): void {
    values.forEach(v => {
      this._rules.required.add(this._process(v));
      this._rules.excluded.delete(this._process(v));
    });
    this._changed();
  }
  public dontRequire(...values: any): void {
    values.forEach(v => this._rules.required.delete(this._process(v)));
    this._changed();
  }
  public setRequired(...values: any): void {
    this._rules.required.clear();
    this.require(values);
  }
}

/*
 * Basic number filter that implements require and exclude
 * but doesn't implement value ranges
 */
export class CandidateFilterNumber extends CandidateFilterBasic {
  public isNumeric = true;

  constructor(...args) {
    super(...args);
  }

  protected _processType(value: any): any {
    return parseFloat(value);
  }

  protected _sort(a: any, b: any): number {
    return a - b;
  }
}


/*
 * Numeric range filter
 */
export class CandidateFilterNumberRange extends CandidateFilter {
  public isNumeric = true;
  public isRange = true;
  public minDescription: string;
  public maxDescription: string;
  public unitName: string;
  public sliderStep: number = 1;
  protected _rules = {
    min: <number>null,
    max: <number>null,
    excludeMissing: <boolean>null,
  }

  constructor(...args) {
    super(...args);
    // We have to define defaults here, because they would override options arguments 
    // if we defined them with the declarations above
    if (this.minDescription == null) this.minDescription = 'Vähintään';
    if (this.maxDescription == null) this.maxDescription = 'Korkeintaan';
  }

  public getValueRange(): [number, number] {
    let range;
    this._values.forEach(v => {
      if (!range) { 
        range = [v,v];
      } else if (v < range[0]) {
        range[0] = v;
      } else if (v > range[1]) {
        range[1] = v;
      }
    });
    return range;
  }
  public getFilterRange(): [number, number] {
    return [this.getMin(), this.getMax()];
  }

  public getMin(): number | null {
    return this._rules.min;
  }
  public setMin(value: number): void {
    if (value <= this.getValueRange()[0]) {
      this._rules.min = null;
    } else {
      this._rules.min = value;
      if (this._rules.max < value) {
        this._rules.max = null;
      }
    }
    this._changed();
  }
  public unsetMin(): void {
    this._rules.min = this._clearRule(this._rules.min);
    this._changed();
  }

  public getMax(): number | null {
    return this._rules.max;
  }
  public setMax(value: number): void {
    if (value >= this.getValueRange()[1]) {
      this._rules.max = null;
    } else {
      this._rules.max = value;
      if (this._rules.min > value) {
        this._rules.min = null;
      }
    }
    this._changed();
  }
  public unsetMax(): void {
    this._rules.max = this._clearRule(this._rules.max);
    this._changed();
  }

  public setExcludeMissing(value: boolean): void {
    this._rules.excludeMissing = value ? true : null; // Have to check here as we use null for a false value
    this._changed();
  }
  public getExcludeMissing(): boolean {
    return this._rules.excludeMissing ? true : false; // Have to check here as we use null for a false value
  }

  protected _processType(value: any): any {
    return parseFloat(value);
  }

  protected _sort(a: any, b: any): number {
    return a - b;
  }

  protected _clearRule(rule: any): any {
    return null;
  }

  get active(): boolean {
    let isActive = false;
    Object.values(this._rules).forEach(r => {
      if (r != null) isActive = true;
    });
    return isActive;
  }

  public match(value: any): boolean {
    if (this.isMissing(value)) {
      if (this._rules.excludeMissing) return false;
      return true;
    } else if ( (this._rules.min == null || value >= this._rules.min) &&
                (this._rules.max == null || value <= this._rules.max) ) {
      return true;
    } else {
      return false;
    }
  }
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
  private _precinct: string;
  private _precinctId: number;
  private questions: QuestionDict;
  private candidates: CandidateDict;
  private partyAverages: QuestionAverageDict;
  private municipalities: any;
  private precincts: any;
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
  public cookieLife = 1000 * 60 * 60 * 24 * 120; // Cookie lifetime in millisecs
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
    age: {
      type: CandidateFilterNumberRange,
      opts: {
        key: 'Q59',
        description: 'Iän perusteella',
        unitName: 'vuotta',
        // minDescription: 'Ikä vähintään', 
        // maxDescription: 'Ikä enintään', 
        multipleValues: false,
      }
    },
    gender: {
      type: CandidateFilterBasic,
      opts: {
        key: 'Q63',
        description: 'Sukupuolen perusteella',
        multipleValues: false,
      }
    },
    party: {
      type: CandidateFilterBasic,
      opts: {
        key: 'party',
        description: 'Puolueen perusteella',
        multipleValues: false,
      }
    },
    motherTongue: {
      type: CandidateFilterBasic,
      opts: {
        key: 'Q64',
        description: 'Äidinkielen perusteella',
        multipleValues: false,
      }
    },
    education: {
      type: CandidateFilterBasic,
      opts: {
        key: 'Q66',
        description: 'Koulutuksen perusteella',
        multipleValues: false,
      }
    },
    politicalExperience: {
      type: CandidateFilterBasic,
      opts: {
        key: 'Q68',
        description: 'Poliittisen kokemuksen perusteella',
        multipleValues: true,
        multipleValueLogicOperator: CandidateFilterLogicOperator.Or,
      }
    },
    /*
    opinion: {
      questionId: 'Q59',
      type: String,
    },
    */
  };
  private filters: CandidateFilter[];
  public dataStatus = {
    precincts:  new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    questions:  new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    candidates: new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    tsne:       new BehaviorSubject<DataStatus>(DataStatus.NotReady),
    filters:    new BehaviorSubject<DataStatus>(DataStatus.NotReady),
  };
  // Shorthands for the dataStatuses
  public precinctDataReady$ =    this.dataStatus.precincts.pipe(filter( t => t === DataStatus.Ready ));
  public questionDataReady$ =    this.dataStatus.questions.pipe(filter( t => t === DataStatus.Ready ));
  public questionDataUpdated$ =  this.dataStatus.questions.pipe(filter( t => t === DataStatus.Updated ));
  public candidateDataReady$ =   this.dataStatus.candidates.pipe(filter( t => t === DataStatus.Ready ));
  public tsneDataReady$ =        this.dataStatus.tsne.pipe(filter( t => t === DataStatus.Ready ));
  public filterDataReady$ =      this.dataStatus.filters.pipe(filter( t => t === DataStatus.Ready ));
  public filterDataUpdated$ =    this.dataStatus.filters.pipe(filter( t => t === DataStatus.Updated ));
  public progressChanged$ =      new EventEmitter<number>();

  constructor(
    private cookie: CookieService,
    // private http: HttpClient
  ) {
    this.initData();
  }

  private async initData(): Promise<void> {
    this.municipalities = await import('../data/municipalities').then( d => { return d.municipalities; } );
    this.precincts = await import('../data/precincts').then( d => { return d.precincts; } );
    await this.setMunicipalityFromCookie();
    this.dataStatus.precincts.next(DataStatus.Ready);
    this.dataStatus.candidates.pipe(filter( t => t !== DataStatus.NotReady )).subscribe(() => this.initFilters());
  }

  // Getters
  get municipality(): string {
    return this._municipality;
  }

  get municipalityId(): number {
    return this._municipalityId;
  }

  get precinct(): string {
    return this._precinct;
  }

  get precinctId(): number {
    return this._precinctId;
  }

  public getPrecinctNameByMunicipalityId(id: number): string {
    if (id in this.municipalities) {
      return this.getPrecinctNameById(this.municipalities[id].precinctId);
    } else {
      throw new Error(`Municipality id '${id}' not found.`);
    }
  }

  public getPrecinctNameById(id: number): string {
    if (id in this.precincts) {
      return this.precincts[id].name;
    } else {
      throw new Error(`Precinct id '${id}' not found.`);
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
    // Return if we don't change the municipality as setting the precinct will reset all answers
    if (id === this._municipalityId && this.candidates && this.questions) {
      return;
    }
    let m = this.municipalities[id];
    this._municipalityId = id;
    this._municipality = m.name;
    this._precinctId = m.precinctId;
    this._precinct = this.precincts[this._precinctId].name;
    this.writeCookie(COOKIE_MUNICIPALITY, this._municipalityId);
    await this.setPrecinct(this._precinctId);
  }

  private async setPrecinct(id: number): Promise<void> {
        
    // Import questions data
    if (! this.questions) {
      this.questions = await import('../data/questions').then( d => { return d.questions; } );
      for (const id in this.questions) {
        this.questions[id].id = id;
      }
    }

    // Read voter answers stored in the cookie
    this.setAnswersFromCookie();

    // Import candidate data
    switch (id) {
      case 1:
        this.candidates = await import('../data/candidates-precinct-1').then( d => { return d.candidates; } );
        break;
      case 2:
        this.candidates = await import('../data/candidates-precinct-2').then( d => { return d.candidates; } );
        break;
      case 3:
        this.candidates = await import('../data/candidates-precinct-3').then( d => { return d.candidates; } );
        break;
      case 4:
        this.candidates = await import('../data/candidates-precinct-4').then( d => { return d.candidates; } );
        break;
      case 5:
        this.candidates = await import('../data/candidates-precinct-5').then( d => { return d.candidates; } );
        break;
      case 6:
        this.candidates = await import('../data/candidates-precinct-6').then( d => { return d.candidates; } );
        break;
      case 7:
        this.candidates = await import('../data/candidates-precinct-7').then( d => { return d.candidates; } );
        break;
      case 8:
        this.candidates = await import('../data/candidates-precinct-8').then( d => { return d.candidates; } );
        break;
      case 9:
        this.candidates = await import('../data/candidates-precinct-9').then( d => { return d.candidates; } );
        break;
      case 10:
        this.candidates = await import('../data/candidates-precinct-10').then( d => { return d.candidates; } );
        break;
      case 11:
        this.candidates = await import('../data/candidates-precinct-11').then( d => { return d.candidates; } );
        break;
      case 12:
        this.candidates = await import('../data/candidates-precinct-12').then( d => { return d.candidates; } );
        break;
      case 13:
        this.candidates = await import('../data/candidates-precinct-13').then( d => { return d.candidates; } );
        break;
      default:
        throw new Error(`Precinct id '${id}' cannot be found among candidate lists.`);
    }

    // Cull candidates with too many missing values
    if (MAX_MISSING_VALS > -1) {
      let qids = this.getLikertQuestionIds();
      for (const id in this.candidates) {
        let missing = 0;
        qids.forEach( q => {
          if (this.isMissing(this.candidates[id][q])) {
            missing++;
          }
        });
        if (missing > MAX_MISSING_VALS) {
          delete this.candidates[id];
        }
      }
    }

    // Ensure that Likert values are stored as numbers
    /* This seems too intensive, so let's just check values are numbers when using them
    const likertIds = Object.keys(this.questions).filter( k => this.questions[k].type === QUESTION_LIKERT );
    for (let candidate in this.candidates) {
      for (const qId in likertIds) {
        if (! this.isMissing(candidate[qId]) ) {
          candidate[qId] = Number(candidate[qId]);
          console.log(qId, candidate[qId]); // DBG
        }
      }
    }
    */

    // Add ids to Candidate objects themselves
    for (const id in this.candidates) {
      this.candidates[id].id = id;
    }

    // Load parties' average answers
    this.partyAverages = await import('../data/answers_by_party_mean').then( d => { return d.questionMeans; } );

    // Emit change events
    this.dataStatus.questions.next(DataStatus.Ready);
    this.dataStatus.candidates.next(DataStatus.Ready);
  }

  public isMissing(value: any): boolean {
    return typeof value === 'undefined' || MISSING_VALS.includes(value);
  }

  public isRelevantQuestion(q: Question): boolean {
    return !q.dropped
           && (!q.precinctId || q.precinctId === this.precinctId);
  }

  public getQuestionsByIds(ids: string[]): QuestionDict {
    if (! this.questions) {
      throw Error("Precinct must be defined before getting Questions");
    }
    let dict: QuestionDict = {};
    ids.forEach( id => dict[id] = this.questions[id] );
    return dict;
  }

  public getLikertQuestionIds(): string[] {
    if (! this.questions) {
      throw Error("Precinct must be defined before getting Questions");
    }
    return Object.keys(this.questions).filter( k => this.questions[k].type === QUESTION_LIKERT && this.isRelevantQuestion(this.questions[k]) );
  }
 
  public getLikertQuestions(): QuestionDict {
    return this.getQuestionsByIds(this.getLikertQuestionIds());
  }

  public getLikertQuestionsAsList(): Question[] {
    return Object.values(this.getLikertQuestions()).sort( (a, b) => {
      let cDiff = this.getCatOrder(a) - this.getCatOrder(b);
      if (cDiff !== 0) {
        return cDiff;
      } else {
        return a.id < b.id ? -1 : 1;
      }
    });
  }

  public getCatOrder(q: Question): number {
    return q.category in this.questionCategoryOrder ? this.questionCategoryOrder[q.category] : 1e10;
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

  public getCandidate(id: string): Candidate {
    return this.candidates[id];
  }

  /*
   * Get the average answer (decimal) to the question 
   * by all members (including all precincts) of the respondent's party
   */
  public getPartyAverage(party: string, qId: string): number {
    if (qId in this.partyAverages && party in this.partyAverages[qId]) {
      return this.partyAverages[qId][party];
    } else {
      throw new Error(`Average value not found for party ${party} and question ${qId}.`);
    }
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

  public countVoterAnswers(): number {
    return this.getVoterAnsweredQuestionIds().length;
  }

  public getVoterAnsweredQuestionIds(): string[] {
    let answered = [];
    for (const id in this.questions) {
      const q = this.questions[id];
      if ('voterAnswer' in q && this.isRelevantQuestion(q)) {
        answered.push(id);
      }
    }
    return answered;
  }

  public getQuestionIdsByAgreement(candidateId: string, agrType: AgreementType): string[] {
    const answered = this.getVoterAnsweredQuestionIds();
    switch (agrType) {
      case AGREEMENT_AGREE:
        return answered.filter( k => this.sameNum(this.questions[k].voterAnswer, this.candidates[candidateId][k]) );
      case AGREEMENT_DISAGREE:
        return answered.filter( k => ! this.sameNum(this.questions[k].voterAnswer, this.candidates[candidateId][k]) );
      case AGREEMENT_VOTER_UNKNOWN:
        return this.getLikertQuestionIds().filter( k => ! answered.includes(k) );
      default:
        throw new Error(`Unknown agreement type '${agrType}'.`);
    }
  }

  // Util to check if two Likert answers match regardless of stored type
  public sameNum(x: any, y:any): boolean {
    return Number(x) == Number(y);
  }

  // Util to get the absolute distance between two Likert answers match regardless of stored type
  public distNum(x: any, y:any): number {
    return Math.abs(Number(x) - Number(y));
  }

  // Shorthands for getQuestionIdsByAgreement() returning Question lists
  public getAgreedQuestionsAsList(candidateId: string): Question[] {
    return Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, AGREEMENT_AGREE)));
  }
  // Sorted by disagreement desc
  public getDisagreedQuestionsAsList(candidateId: string): Question[] {
    return Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, AGREEMENT_DISAGREE)))
             .sort( (a, b) => { 
               let diff =   this.distNum(a.voterAnswer, this.isMissing(this.candidates[candidateId][a.id]) ? this.invertAnswer(a.voterAnswer) : this.candidates[candidateId][a.id] )
                          - this.distNum(b.voterAnswer, this.isMissing(this.candidates[candidateId][b.id]) ? this.invertAnswer(b.voterAnswer) : this.candidates[candidateId][b.id] );
               return -1 * diff; // -1 to make sorting descending
             });
  }
  public getUnansweredQuestionsAsList(candidateId: string): Question[] {
    return Object.values(this.getQuestionsByIds(this.getQuestionIdsByAgreement(candidateId, AGREEMENT_VOTER_UNKNOWN)));
  }


  // Returns the maximally distant Likert answer
  public invertAnswer(value: number): number {
    return value <= 3 ? 5 : 1;
  }

  // Returns the maximally distant Likert answer with regard to the voter's answer to the given question
  public getInvertedVoterAnswer(id: string): number {
    let answer = this.getVoterAnswer(id);
    if (answer) {
      return this.invertAnswer(answer);
    } else {
      throw new Error(`No voter answer supplied for question ${id}.`);
    }
  }

  public writeCookie(name:string, value:any): void {
    // Save in cookie
    let expiry = new Date();
    expiry.setTime(expiry.getTime() + this.cookieLife);
    // TODO Secure cookies don't currently work, maybe because of localhost?
    this.cookie.set(COOKIE_PREFIX + name, value.toString(), expiry, COOKIE_PATH, COOKIE_DOMAIN, false, 'Strict');
  }

  public async setMunicipalityFromCookie(): Promise<void> {
    let name = COOKIE_PREFIX + COOKIE_MUNICIPALITY;
    if (this.cookie.check(name)) {
      await this.setMunicipality(Number(this.cookie.get(name)));
    }
  }

  public setAnswersFromCookie(): void {
    for (const id in this.questions) {
      const name = COOKIE_PREFIX + id;
      if (this.cookie.check(name)) {
        // Use Number as cookie values are stored as text
        this.setVoterAnswer(id, Number(this.cookie.get(name)));
      }
    }
  }

  public unsetVoterAnswers(): void {
    // TODO Check if necessary
    for (const id in this.questions) {
      delete this.questions[id].voterAnswer;
    }
    this.questions = null;
    this._precinctId = null;
    this._municipalityId = null;
    this.dataStatus.questions.next(DataStatus.NotReady);
    this.dataStatus.candidates.next(DataStatus.NotReady);
    this.deleteCookie();
  }

  public deleteCookie(): void {
    this.cookie.deleteAll(COOKIE_PATH);
  }

  public initTsne(): void {
    // Prepare raw data for tSNE
    let tsneData = new Array<Array<number>>();
    let tsneCols = this.getVoterAnsweredQuestionIds();
    this.tsneIds = new Array<string>();

    for (const id in this.candidates) {
      let d = [];
      tsneCols.forEach( q => {
        let v = this.candidates[id][q];
        // Convert missing values to max distance from voter
        if (this.isMissing(v)) {
          v = this.getInvertedVoterAnswer(q);
        }
        // Normalize
        // v = (v - 1) / 5;
        d.push(Number(v));
      } );
      tsneData.push(d);
      this.tsneIds.push(id);
    }
    // Add the voter as the last item
    let voter = [];
    tsneCols.forEach( q => voter.push(Number(this.getVoterAnswer(q))) );
    tsneData.push(voter);

    // Create tsne object and initialize
    this.tsne = new tsnejs.tSNE(this.tsneOptions);
    this.tsne.initDataRaw(tsneData);

    // Start calculating
    // TODO: make this nice and async instead of setInterval
    //       couldn't make async work nicely with the spinner
    // Once calculation is done, draw the map
    this.tsneIntervalRef = setInterval( () => {
      if (this.tsne.iter % 100 == 0) {
        this.progressChanged$.emit(this.getTsneProgress());
      }
      for (let i = 0; i < this.tsneOptions.stepChunk; i++) {
        this.tsne.step();
        if (this.tsne.iter >= this.tsneOptions.maxChunks * this.tsneOptions.stepChunk) {
          clearInterval(this.tsneIntervalRef);
          this.updateTsne();
        }
      }
    }, 1);
  }

  // Get minimum and maximum values from the arrays
  private _getBounds(vals: number[], index = 0): number[] {
    if (!vals.length) {
      throw new Error("Argument vals cannot be empty");
    }
    let min = vals[0][index];
    let max = min;
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

  public updateTsne(): void {
    // Get solution
    let solution = this.tsne.getSolution();

    // Find out min and max dimensions to normalize tSNE coordinates 
    let bounds = [this._getBounds(solution, 0),
                  this._getBounds(solution, 1)];
    // Set scale based on the greatest absolute distance from the voter in either direction
    // The last item in the solution is the voter (can't use pop as the solver needs the solution)
    let voter = solution[solution.length - 1];
    let max = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (Math.abs(voter[i] - bounds[i][j]) > max) {
          max = Math.abs(voter[i] - bounds[i][j]);
        }
      }
    }
    let scale = 1 / (2 * max);
    
    // Set tSNE coordinates
    // Remember to skip the last one as that's the voter
    
    for (let i = 0; i < solution.length - 1; i++) {
      this.candidates[this.tsneIds[i]].tsne1 = (solution[i][0] - voter[0]) * scale + 0.5; // Scale and center on voter
      this.candidates[this.tsneIds[i]].tsne2 = (solution[i][1] - voter[1]) * scale + 0.5;
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
    this.filters = [];
    // Reset filter data for candidates
    // TODO: We are not emitting an update event for candidates, 
    // so if somebody already caught the first event, they won't know of the loss of filters...
    this.clearFilteredCandidates(true);

    // Create filters
    for (const f in this.filterOpts) {
      const filter = new this.filterOpts[f].type(this.filterOpts[f].opts);
      // Extract unique values
      for (let candidate in this.candidates) {
        filter.addValue(this.candidates[candidate][filter.key]);
      }
      filter.rulesChanged$.subscribe(f => this.applyFilter(f));
      this.filters.push(filter);
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
    return filter.apply(this.candidates);
  }

  public getFilters(): CandidateFilter[] {
    return this.filters;
  }

  /*
  public setFilters(filters: CandidateFilter[]): void {
    this.filters = filters;
    this.clearFilteredCandidates(true);
    filters.forEach(f => f.apply(this.candidates, 'filteredOut'));
    this.dataStatus.filters.next(DataStatus.Updated);
  }
  */
}