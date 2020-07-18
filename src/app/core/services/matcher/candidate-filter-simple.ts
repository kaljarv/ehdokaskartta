import { CandidateFilterBasic } from './candidate-filter-basic';


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

  constructor(...args) {
    super(...args);
  }

  // Overrides

  get active(): boolean {
    return this._rules.excluded.size > 0;
  }

  public match(value: any): boolean {
    return !this.isExcluded(value);
  }

  // New methods

  public isRequired(value: any): boolean {
    return this.active && this._values.has(value) && !this._rules.excluded.has(value);
  }
  public isExcluded(value: any): boolean {
    return this._rules.excluded.has(value);
  }
  public getRequired(): any[] {
    return Array.from(this._values).filter(v => !this._rules.excluded.has(v));
  }
  public getExcluded(): any[] {
    return Array.from(this._rules.excluded);
  }
  public exclude(...values: any): void {
    values.forEach(v => this._rules.excluded.add(this._process(v)));
    this._changed();
  }
  public dontExclude(...values: any): void {
    values.forEach(v => this._rules.excluded.delete(this._process(v)));
    this._changed();
  }
  public setExcluded(...values: any): void {
    this._rules.excluded.clear();
    this.exclude(...values);
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
