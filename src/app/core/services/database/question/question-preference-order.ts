import {
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
  partyAverages?: {
    [partyId: string]: number
  }
}

export class QuestionPreferenceOrder extends QuestionNumeric {

  /*
   * Overrides
   */
  public voterAnswer: number[];
  public partyAverages: {
    [partyId: string]: number
  }

  readonly maxAnswer: never;
  readonly minAnswer: never;
  readonly neutralAnswer = [];

  constructor(options: QuestionOptionsPreferenceOrder) {
    super(options);
    if (!options.values || options.values.length === 0)
      throw new Error('QuestionPreferenceOrder must have values!');
  }

  /*
   * Overrides
   */
  public isMissing(value: any): boolean {
    return value == null || !Array.isArray(value) || value.length === 0;
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
    return value.reverse();
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
    const pairs = this.getPairwisePreferences();
    // The weight for one question is 1 divided by the number or pairs
    const weight = pairs.length;
    // Convert boolean pairs to numeric values centered on 0.5
    return pairs.map(v => 0.5 + v * weight / 2);
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
  public getPairwisePreferences(preferenceOrder: number[] = this.voterAnswer): number[] {

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

  /*
   * TODO:
   * match
   */

}

