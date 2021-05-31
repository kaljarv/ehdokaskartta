import {
  AgreementType,
  QuestionNumeric,
  QuestionNumericValue,
  QuestionOptionsNumeric
} from './question-numeric';

// NB. Commas, semicolons and whitespace are not allowed in cookie values
export const ITEM_SEPARATOR_IN_STRING = '/';

/*
 * Base class for Likert question objects
 */

export interface QuestionOptionsPreferenceOrder extends QuestionOptionsNumeric {
  values: QuestionNumericValue[],
}

export class QuestionPreferenceOrder extends QuestionNumeric {

  readonly maxAnswer: never;
  readonly minAnswer: never;
  readonly neutralAnswer = [];

  /*
   * Overrides
   */
  protected _voterAnswer: number[];

  constructor(options: QuestionOptionsPreferenceOrder) {
    super(options);
    if (!options.values || options.values.length === 0)
      throw new Error('QuestionPreferenceOrder must have values!');
  }

  /*
   * Overrides
   */

  /*
   * We need to make a copy of the value to skirt possible reference issues
   */
  get voterAnswer(): number[] {
    return this._voterAnswer ? [...this._voterAnswer] : undefined;
  }

  /*
   * We need to make a copy of the value to skirt possible reference issues
   */
  set voterAnswer(value: number[]) {
    this.skippedByVoter = false;
    if (value != null)
      this._voterAnswer = [...value];
  }

  public isMissing(value: number[]): boolean {
    return value == null || value.length === 0;
  }

  public convertAnswerToString(value: number[] = this.voterAnswer): string {
    return this.voterAnswer.join(ITEM_SEPARATOR_IN_STRING);
  }

  public parseAnswerFromString(value: string): number[] {
    return value.split(ITEM_SEPARATOR_IN_STRING).map(v => Number(v));
  }

  /*
   * Note that biasedTowardsMax has no effect on this
   */
  public invertAnswer(value: number[], biasedTowardsMax: boolean = true): number[] {
    return [...value].reverse();
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number[] {
    return this.invertAnswer(this.voterAnswer, biasedTowardsMax);
  }

  /*
   * For using in mapping, we break the preference order into all possible pairwise preferences
   * and weigh them so that their combined weight equals 1
   * See: https://en.wikipedia.org/wiki/Kendall_rank_correlation_coefficient
   */
  public normalizeValue(value: number[] = this.voterAnswer): number[] {

    // This will house the pairwise preferences
    const pairs = this.getPairwisePreferences(value);
    // The weight for one question is 1 divided by the number or pairs
    const weight = 1 / pairs.length;
    // Convert boolean pairs to numeric values centered on 0.5
    return pairs.map(v => 0.5 + v * weight / 2);
  }

  /*
   * Calc distance between two preference orders by counting pairwise matches,
   * see: https://en.wikipedia.org/wiki/Kendall_rank_correlation_coefficient
   * Used by all matching methods
   * Scale 0 to 1
   */
  public getDistance(value1: number[], value2: number[], disallowBothMissing: boolean = false): number {
    if (this.isMissing(value1) && this.isMissing(value2)) {
      if (disallowBothMissing)
        throw new Error("Both values to getDistance cannot be missing!");
      return 0;
    }

    let dist = 0;
    
    // Get pairwise preferences
    const pairs1 = this.getPairwisePreferences(this.isMissing(value1) ? this.invertAnswer(value2) : value1);
    const pairs2 = this.getPairwisePreferences(this.isMissing(value2) ? this.invertAnswer(value1) : value2);

    // We just subtract the values from each other, thus the distance for
    // a pair ranges from 0 to 2
    for (let i = 0; i < pairs1.length; i++)
      dist += Math.abs(pairs1[i] - pairs2[i]);
    
    // Normalize distance to 0--1
    return dist / (2 * pairs1.length);
  }

  /*
   * Return pairwise preferences for all possible value pairs. The form for, eg., 4 values is:
   * [ 
   *   this.values[0] > this.values[1], 
   *   this.values[0] > this.values[2],
   *   this.values[0] > this.values[3],
   *   this.values[1] > this.values[2],
   *   this.values[1] > this.values[3],
   *   this.values[2] > this.values[3]
   * ]
   * The values return are numbers where -1 imlplies <, 1 > and 0 == or unknown
   * TODO: Use a more efficient algorithm for this naïve one
   */
  public getPairwisePreferences(preferenceOrder: number[]): number[] {

    const prefs: number[] = [];

    // Convert values to indeces of the values array
    const indeces: number[] = preferenceOrder.map(v => this.getValueIndex(v));

    // Iterate through all permutations and check their results from the indices
    for (let i = 0; i < this.values.length - 1; i++) {
      for (let j = i + 1; j < this.values.length; j++) {
        const iI = indeces.indexOf(i),
              iJ = indeces.indexOf(j);
        let v = 1;
        if (iI === -1 && iJ === -1)
          v = 0;
        else if (iI === -1 || iJ < iI)
          v = -1;
        prefs.push(v);
      }
    }
        
    return prefs;
  }

  /*
   * Get the number of pairwise combinations, ie. the binomial coefficient
   */
  public getPairwisePreferencesLength(): number {
    return this.values.length * (this.values.length - 1) / 2;
  }

  /*
   * Randomly order values for voter to start choosing
   * Courtesy of CoolAJ86 et al.
   * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  public getShuffledValues(): QuestionNumericValue[] {
    const values = this.values;
    let currentIndex: number = values.length,
        randomIndex: number,
        temporaryValue: QuestionNumericValue;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = values[currentIndex];
      values[currentIndex] = values[randomIndex];
      values[randomIndex] = temporaryValue;
    }

    return values;
  }

  /*
   * For convenience. Returns the QuestionNumericValues in the voter answer order
   */
  public getVoterAnswerValues(): QuestionNumericValue[] {
    if (!this.voterAnswer)
      return undefined;
    return this.voterAnswer.map(v => this.getValue(v));
  }

}

