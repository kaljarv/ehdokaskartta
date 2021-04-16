import {
  Question,
  QuestionOptions
} from './question';

/*
 * For matching functions in matcher and filters
 */

export enum AgreementType {
  Agree,
  Disagree,
  OpinionUnknown,
  MostlyAgree, // Within eg. 1 Likert step
  StronglyDisagree, // More than eg. 1 Likert step away
}

export interface QuestionOptionsNumeric extends QuestionOptions {
  partyAverages?: {
    [partyId: string]: number | number[]
  }
}

/*
 * Base class for numeric question objects
 * Only numeric questions allow for voter answers and party averages
 */

export abstract class QuestionNumeric extends Question {
  public voterAnswer: number | number[];
  public partyAverages: {
    [partyId: string]: number | number[]
  }
  /*
   * Convenience getters for AgreementTypes
   */
  static readonly agree: AgreementType = AgreementType.Agree;
  static readonly disagree: AgreementType = AgreementType.Disagree;
  static readonly opinionUnknown: AgreementType = AgreementType.OpinionUnknown;
  static readonly mostlyAgree: AgreementType = AgreementType.MostlyAgree;
  static readonly stronglyDisagree: AgreementType = AgreementType.StronglyDisagree;
  /*
   * Override these in subclasses
   */
  public maxAnswer: number = 5;
  public minAnswer: number = 1;
  public neutralAnswer: number = 3;

  constructor(options: QuestionOptionsNumeric) {
    super(options);
    this.partyAverages = options.partyAverages ?? {};
  }

  /*
   * Get possible values for this question
   */
  get values(): number[] {
    const vv = [];
    for (let i = this.minAnswer; i <= this.maxAnswer; i++) {
      vv.push(i);
    }
    return vv;
  }

  /*
   * For convenience
   */
  public unsetVoterAnswer(): void {
    this.voterAnswer = undefined;
  }

  /*
   * Override if needed
   */
  public isMissing(value: any): boolean {
    return value == null || isNaN(value);
  }

  /*
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: any, biasedTowardsMax: boolean = true): number {
    return Number(value) <= (biasedTowardsMax ? this.neutralAnswer : this.neutralAnswer - 1) ? this.maxAnswer : this.minAnswer;
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number {
    if (this.voterAnswer == null)
      throw new Error(`No voter answer for question '${this.id}'.`);
    return this.invertAnswer(this.voterAnswer, biasedTowardsMax);
  }

    /*
   * Calc distance between two values
   * NB. If one of the values is missing, it's treated as inverted
   */
    public getDistance(value1: any, value2: any): number {
      if (this.isMissing(value1) && this.isMissing(value2)) {
        throw new Error("Both values to getDistance cannot be missing!");
      } else {
        return Math.abs(
          Number(this.isMissing(value1) ? this.invertAnswer(value2) : value1) -
          Number(this.isMissing(value2) ? this.invertAnswer(value1) : value2)
        );
      }
    }
  
    /*
     * Match to values and get their AgreementType
     */
    public match(value1: any, value2: any, strict: boolean = false, allowOpinionUnknown: boolean = true): AgreementType {
     
      if (allowOpinionUnknown && value1 == null) {
        return AgreementType.OpinionUnknown;
      }
  
      const dist = this.getDistance(value1, value2);
  
      if (strict) {
        return dist === 0 ? AgreementType.Agree: AgreementType.Disagree;
      }
  
      switch (dist) {
        case 0:
        case 1:
          return AgreementType.MostlyAgree;
        default:
          return AgreementType.StronglyDisagree;
      }
    }
  
    /*
     * Convenience wrappers for match
     */
    public doMatchAgreementType(value1: any, value2: any, type: AgreementType): boolean {
      switch (type) {
        case AgreementType.Agree:
          return this.doAgree(value1, value2);
        case AgreementType.Disagree:
          return this.doDisagree(value1, value2);
        case AgreementType.MostlyAgree:
          return this.doMostlyAgree(value1, value2);
        case AgreementType.StronglyDisagree:
          return this.doStronglyDisagree(value1, value2);
        case AgreementType.OpinionUnknown:
          return this.doHaveOpinionUnknown(value1);
      }
    }
  
    public doAgree(value1: any, value2: any): boolean {
      return this.match(value1, value2, true) === AgreementType.Agree;
    }
  
    public doDisagree(value1: any, value2: any): boolean {
      return this.match(value1, value2, true) === AgreementType.Disagree;
    }
  
    public doMostlyAgree(value1: any, value2: any): boolean {
      return this.match(value1, value2, false) === AgreementType.MostlyAgree;
    }
  
    public doStronglyDisagree(value1: any, value2: any): boolean {
      return this.match(value1, value2, false) === AgreementType.StronglyDisagree;
    }
  
    public doHaveOpinionUnknown(value1: any, value2: any = null): boolean {
      return this.match(value1, value2, false) === AgreementType.OpinionUnknown;
    }
}