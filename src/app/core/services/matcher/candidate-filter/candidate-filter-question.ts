import { 
  CandidateFilter 
} from './candidate-filter';

import { 
  QuestionLikert 
} from '../../database';

// These are used as keys to the rules, they must match the agreement properties in the LikertUtility class
export type AgreementTypeGetter = 'agree' | 'disagree' | 'mostlyAgree' | 'stronglyDisagree' | 'opinionUnknown';

/*
 * Question agreement filter
 */
export class CandidateFilterQuestion extends CandidateFilter {
  readonly isNumeric: boolean = false;

  // NB. agreementType must be an AgreementType but we cannot enforce it as an index
  protected _rules: {
    [agreementType: string]: Set<QuestionLikert>
  } = {};
  protected _valueGetter: () => Set<QuestionLikert>;
  protected _isInitialized: boolean = false;

  constructor(...args) {
    super(...args);
    this._isInitialized = true;
  }

  // Overrides

  get _values(): Set<QuestionLikert> {
    return this._valueGetter ? this._valueGetter() : new Set();
  }
  // We need this because the super constructor implicitly sets _values
  set _values(_: Set<QuestionLikert>) {
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
          if (! key.doMatchAgreementType(key.voterAnswer, candidate[key.id], key[type]))
            return false;
        } 
      }
    }
    return true;
  }

  // New methods

  // We need to set a dynamic value getter as the voter's answers won't otherwise be added to values
  public setValueGetter(getter: () => Set<QuestionLikert>): void {
    this._valueGetter = getter;
  }

  // Rule setters

  public require(type: AgreementTypeGetter, question: QuestionLikert): void {
    if (this._rules[type]) {
      this._rules[type].add(question);
    } else {
      this._rules[type] = new Set<QuestionLikert>([question]);
    }
  }

  public dontRequire(type: AgreementTypeGetter, question: QuestionLikert): void {
    if (this._rules[type]) {
      this._rules[type].delete(question);
      if (this._rules[type].size === 0)
        delete this._rules[type];
    }
  }

  public isRequired(type: AgreementTypeGetter, question: QuestionLikert): boolean {
    return this._rules[type] && this._rules[type].has(question);
  }

  // Rule setter and getter shortcuts
  // TODO Implement others too

  public requireMostlyAgree(question: QuestionLikert): void {
    this.require('mostlyAgree', question);
  }

  public dontRequireMostlyAgree(question: QuestionLikert): void {
    this.dontRequire('mostlyAgree', question);
  }

  public isRequiredMostlyAgree(question: QuestionLikert): boolean {
    return this.isRequired('mostlyAgree', question);
  }

}
