import {
  CandidateFilterOptions, 
  MISSING_FILTER_VAL 
} from './candidate-filter';
import { 
  CandidateFilterBasic
} from './candidate-filter-basic';

/*
 * Simple string filter that implements exclusion-only matching
 * ie. if require(x) translates to exclude(y != x)
 * You can still use require and exclude methods but we use only
 * one underlying rule set
 */
export class CandidateFilterSimple extends CandidateFilterBasic {

  protected _rules: { [name: string]: any } = {
    excluded: new Set(),
  }

  constructor(
    opts: CandidateFilterOptions,
    values?: any[]
  ) {
    super(opts, values);
  }

  // Overrides

  get active(): boolean {
    return this._rules.excluded.size > 0;
  }

  public match(value: any): boolean {
    return !this.isExcluded(value) &&
           !(value === MISSING_FILTER_VAL && !this.hasMissing);
  }

  // New methods

  public isRequired(value: any): boolean {
    return this.active && this._values.has(value) && !this._rules.excluded.has(value);
  }
  public getRequired(): any[] {
    return Array.from(this._values).filter(v => !this._rules.excluded.has(v));
  }
  public exclude(...values: any): void {
    values.forEach(v => this._rules.excluded.add(this._process(v)));
    this._changed();
  }

  /*
   * NB. With this filter, require is not cumulative with consecutive calls.
   */ 
  public require(...values: any): void {
    this.setExcluded(...Array.from(this._values).filter(v => !values.includes(v)));
  }
  public dontRequire(...values: any): void {
    this.exclude(...values);
  }
  public setRequired(...values: any): void {
    this.require(...values);
  }
}
