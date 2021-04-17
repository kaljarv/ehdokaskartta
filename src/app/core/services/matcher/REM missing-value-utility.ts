/*
 * Provides an utility to check for missing (string) values
 */

// NB. These are for string values, for numeric values use the Likert utility
export const MISSING_VALS = [null, "-", "", "En halua kertoa"];

export class MissingValueUtility {

  constructor() {
  }

  /*
   * Check if the value is missing
   */
  public isMissing(value: any): boolean {
    return typeof value === 'undefined' || MISSING_VALS.includes(value);
  }

}

// For convenience
export const MissingValue = new MissingValueUtility();