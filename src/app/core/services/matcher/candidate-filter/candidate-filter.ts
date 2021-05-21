import { 
  EventEmitter 
} from '@angular/core';

import { 
  Candidate,
  CandidateDict,
  Question
} from '../../database';


export type CandidateFilterAnswerQuestion = {
  type: 'question',
  question: Question
}

export type CandidateFilterAnswerProperty = {
  type: 'property',
  property: keyof Candidate
}

export type CandidateFilterAnswerCandidate = {
  type: 'candidate'
}

export type CandidateFilterAnswerType = CandidateFilterAnswerQuestion | CandidateFilterAnswerProperty | CandidateFilterAnswerCandidate;

export interface CandidateFilterOptions {
  question?: Question,
  property?: keyof Candidate,
  title?: string,
  description?: string,
  multipleValues?: boolean,
  multipleValueSeparator?: string
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
export abstract class CandidateFilter {
  public answerType: CandidateFilterAnswerType;
  public title: string;
  public description: string;
  // Multiple values means a candidate may have multiple values for the datum filtered
  public multipleValues: boolean = false;
  // If this is defined added values are split
  public multipleValueSeparator: string;
  public multipleValueLogicOperator: CandidateFilterLogicOperator = CandidateFilterLogicOperator.Or;
  public rulesChanged: EventEmitter<CandidateFilter> = new EventEmitter<CandidateFilter>();
  readonly isNumeric: boolean = true;
  protected _valuesSet: Set<any> = new Set();
  protected _rules: { [name: string]: any } = {};
  protected _supressRulesChanged = false;

  constructor(
    opts: CandidateFilterOptions,
    values?: any[]
  ) {
    const {property, question, ...otherOpts} = opts;

    for (let key in otherOpts)
      this[key] = opts[key];

    if (values)
      this.addValue(values);

    if (property != null)
      this.answerType = {type: 'property', property}
    else if (question != null)
      this.answerType = {type: 'question', question}
    else
      this.answerType = {type: 'candidate'}
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
    if (this.isNumeric)
      return a - b;
    else
      return a.toString().localeCompare(b.toString());
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

  // We need to clunkily use these accessors, as we'll override them in subclasses
  get _values(): Set<any> {
    return this._valuesSet;
  }

  set _values(values: Set<any>) {
    this._valuesSet = values;
  }
  
  public getValues(dontSort: boolean = false): any[] {
    return dontSort ? 
           Array.from(this._values) : 
           Array.from(this._values).sort((a, b) => {
             // Sort missing values to the end
             if (a === b)
               return 0;
             else if (a === MISSING_FILTER_VAL)
               return 1;
             else if (b === MISSING_FILTER_VAL)
               return -1;
             else
               return this._sort(a, b);
           });
  }

  get valuesLength(): number {
    return this._values.size;
  }

  public isMissing(value: any): boolean {
    return value === MISSING_FILTER_VAL;
  }

  get hasMissing(): boolean {
    return this._values.has(MISSING_FILTER_VAL);
  }

  protected _getAnswer(candidate: Candidate): any {
    switch (this.answerType.type) {
      case 'candidate':
        return candidate;
      case 'property':
        return candidate[this.answerType.property];
      case 'question':
        return candidate.getAnswer(this.answerType.question);
    }
  }

  protected _process(value: any): any {
    switch (this.answerType.type) {
      case 'candidate':
        return value;
      case 'property':
        return value == null ? MISSING_FILTER_VAL :  this._processType(value);
      case 'question':
        return this.answerType.question.isMissing(value) ? MISSING_FILTER_VAL :  this._processType(value);
    }
  }

  /*
   * NB:
   * Splitting with this.multipleValueSeparator, which is risky!
   */
  public addValue(...values: any): void {
    values.filter(v => v != null).forEach(v => {

      // Multiple values might be stored as arrays, so we need to expand them
      let vArr = this._splitMultiple(v);

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

      const vArr = this._splitMultiple(unprocessedValue);

      // For Or any of the values must be true, otherwise return false
      // For And none of the values can be false, if so, return true
      for (let i = 0; i < vArr.length; i++) {
        let r = this.match(this._process(vArr[i]));
        if (r && this.multipleValueLogicOperator === CandidateFilterLogicOperator.Or)
          return true;
        else if (!r && this.multipleValueLogicOperator === CandidateFilterLogicOperator.And)
          return false;
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

  public apply(candidates: CandidateDict, filteredKey: string = 'filteredOut'): number {
    let count = 0;
    // Apply test to all candidates
    for (const id in candidates) {
      const candidate = candidates[id];
      // Get already active filters
      let fOut = filteredKey in candidate ? candidate[filteredKey] : null;
      if (this.active && !this.matchMultiple(this._getAnswer(candidate))) {
        // We save the applied filter in the filteredOut prop
        if (fOut)
          fOut.add(this);
        else
          fOut = new Set<CandidateFilter>([this]);
        count++;
      } else if (fOut) {
        // Filter matched, so we remove this from the filters
        fOut.delete(this);
        // If no filters apply remove the set altogether
        if (!fOut.size) 
          fOut = null;
      }
      candidate[filteredKey] = fOut;
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
    if (!this._supressRulesChanged) this.rulesChanged.emit(this);
  }

  protected _splitMultiple(value: any): any[] {
    if (Array.isArray(value))
      return value;
    if (this.multipleValues && this.multipleValueSeparator != null && typeof value === 'string')
      return value.split(this.multipleValueSeparator);
    return [value];
  }
}