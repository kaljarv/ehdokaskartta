import { CandidateFilter } from './candidate-filter';

import { Likert } from './likert-utility';

// These are used as keys to the rules, they must match the agreement properties in the LikertUtility class
export type AgreementTypeGetter = 'agree' | 'disagree' | 'mostlyAgree' | 'stronglyDisagree' | 'opinionUnknown';

/*
 * Question agreement filter
 */
export class CandidateFilterQuestion extends CandidateFilter {
  readonly isNumeric: boolean = false;

  // NB. agreementType must be an AgreementType but we cannot enforce it as an index
  protected _rules: {
    [agreementType: string]: Set<string>
  } = {};
  protected _voterAnswers: {
    [questionId: string]: number
  };
  protected _valueGetter: () => Set<any>;
  protected _isInitialized: boolean = false;

  constructor(...args) {
    super(...args);
    this._isInitialized = true;
  }

  // Overrides

  get _values(): Set<any> {
    return this._valueGetter ? this._valueGetter() : new Set();
  }
  // We need this because the super constructor implicitly sets _values
  set _values(_: Set<any>) {
    if (this._isInitialized) {
      throw new Error("Cannot set _values on CandidateFilterQuestion. Use setValueGetter instead.")
    }
  }

  get active(): boolean {
    for (let type in this._rules) {
      if (this._rules[type].size)
        return true;
    }
    return false;
  }

  public match(candidate: any): boolean {
    for (let type in this._rules) {
      if (this._rules[type].size) {
        for (let key of this._rules[type]) {
          if (! Likert.doMatchAgreementType(this._voterAnswers[key], candidate[key], Likert[type]))
            return false;
        } 
      }
    }
    return true;
  }

  // We need a different kind of apply for this filter
  public apply(_1, _2 = '') {
    throw new Error("The method apply is not applicable for CandidateFilterQuestion. Use applyWithVoter instead.");
    return 0;
  }

  // New methods

  // We need to set a dynamic value getter as the voter's answers won't otherwise be added to values
  public setValueGetter(getter: () => Set<any>): void {
    this._valueGetter = getter;
  }

  // We need to override apply as this filter works differently from the other,
  // taking also voterAnswers as argument, not using this.key and not using matchMultiple
  public applyWithVoter(data: {[id: string]: {}}, voterAnswers: {[questionId: string]: number}, filteredKey: string = 'filteredOut' ) {
    // We save these in a property so that we can override match with the default signature
    this._voterAnswers = voterAnswers; // Different from apply
    let count = 0;
    for (const id in data) {
      let fOut = (filteredKey in data[id]) ? data[id][filteredKey] : null;
      if (this.active && !this.match(data[id])) { // Different from apply
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

  // Rule setters

  public require(type: AgreementTypeGetter, questionId: any): void {
    if (this._rules[type]) {
      this._rules[type].add(questionId);
    } else {
      this._rules[type] = new Set<string>([questionId]);
    }
  }

  public dontRequire(type: AgreementTypeGetter, questionId: any): void {
    if (this._rules[type]) {
      this._rules[type].delete(questionId);
      if (this._rules[type].size === 0)
        delete this._rules[type];
    }
  }

  public isRequired(type: AgreementTypeGetter, questionId: any): boolean {
    return this._rules[type] && this._rules[type].has(questionId);
  }

  // Rule setter and getter shortcuts
  // TODO Implement others too

  public requireMostlyAgree(questionId: any): void {
    this.require('mostlyAgree', questionId);
  }

  public dontRequireMostlyAgree(questionId: any): void {
    this.dontRequire('mostlyAgree', questionId);
  }

  public isRequiredMostlyAgree(questionId: any): boolean {
    return this.isRequired('mostlyAgree', questionId);
  }

}
