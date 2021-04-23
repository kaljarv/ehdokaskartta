import { 
  CandidateFilter 
} from './candidate-filter';

import { 
  Candidate,
  QuestionNumeric 
} from '../../database';
import {
  CandidateFilterOptions 
} from './candidate-filter';

// These are used as keys to the rules, they must match the agreement properties in the LikertUtility class
export type AgreementTypeGetter = 'agree' | 'disagree' | 'mostlyAgree' | 'stronglyDisagree' | 'opinionUnknown';

/*
 * Question agreement filter
 */
export class CandidateFilterMultiQuestion extends CandidateFilter {
  readonly isNumeric: boolean = false;

  // NB. agreementType must be an AgreementType but we cannot enforce it as an index
  protected _rules: {
    [agreementType: string]: Set<QuestionNumeric>
  } = {};
  protected _valueGetter: () => Set<QuestionNumeric>;
  protected _isInitialized: boolean = false;

  constructor(
    opts: CandidateFilterOptions,
    values?: any[]
  ) {
    super(opts, values);
    this._isInitialized = true;
  }

  // Overrides

  get _values(): Set<QuestionNumeric> {
    return this._valueGetter ? this._valueGetter() : new Set();
  }
  // We need this because the super constructor implicitly sets _values
  set _values(_: Set<QuestionNumeric>) {
    if (this._isInitialized)
      throw new Error("Cannot set _values on CandidateFilterMultiQuestion. Use setValueGetter instead.")
  }

  get active(): boolean {
    for (let type in this._rules) {
      if (this._rules[type].size)
        return true;
    }
    return false;
  }

  public match(candidate: Candidate): boolean {
    for (let type in this._rules) {
      if (this._rules[type].size) {
        for (let key of this._rules[type]) {
          switch (type) {
            case 'agree':
              if (! key.doStrictlyAgree(key.voterAnswer, candidate.getAnswer(key)))
                return false;
              break;
            case 'disagree':
              if (! key.doStrictlyDisagree(key.voterAnswer, candidate.getAnswer(key)))
                return false;
              break;
            case 'mostlyAgree':
              if (! key.doLooselyAgree(key.voterAnswer, candidate.getAnswer(key)))
                return false;
              break;
            case 'stronglyDisagree':
              if (! key.doLooselyDisagree(key.voterAnswer, candidate.getAnswer(key)))
                return false;
              break;
            case 'opinionUnknown':
              if (! key.isMissing(candidate.getAnswer(key)))
                return false;
              break;
          }
        } 
      }
    }
    return true;
  }

  // New methods

  // We need to set a dynamic value getter as the voter's answers won't otherwise be added to values
  public setValueGetter(getter: () => Set<QuestionNumeric>): void {
    this._valueGetter = getter;
  }

  // Rule setters

  public require(type: AgreementTypeGetter, question: QuestionNumeric): void {
    if (this._rules[type]) {
      this._rules[type].add(question);
    } else {
      this._rules[type] = new Set<QuestionNumeric>([question]);
    }
  }

  public dontRequire(type: AgreementTypeGetter, question: QuestionNumeric): void {
    if (this._rules[type]) {
      this._rules[type].delete(question);
      if (this._rules[type].size === 0)
        delete this._rules[type];
    }
  }

  public isRequired(type: AgreementTypeGetter, question: QuestionNumeric): boolean {
    return this._rules[type] && this._rules[type].has(question);
  }

  // Rule setter and getter shortcuts
  // TODO Implement others too

  public requireMostlyAgree(question: QuestionNumeric): void {
    this.require('mostlyAgree', question);
  }

  public dontRequireMostlyAgree(question: QuestionNumeric): void {
    this.dontRequire('mostlyAgree', question);
  }

  public isRequiredMostlyAgree(question: QuestionNumeric): boolean {
    return this.isRequired('mostlyAgree', question);
  }

}
