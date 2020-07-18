import { Pipe, PipeTransform } from '@angular/core';

export const DEFAULT_ABBREVIATION_LENGTH: number = 3;
export const ABBREVIATION_MIN_LENGTH: number = 5;
export const ABBREVIATIONS: {[termInLowercase: string]: string} = {
  "eläinoikeuspuolue": "EOP",
  "feministinen puolue": "FP",
  "itsenäisyyspuolue": "IPU",
  "kansalaispuolue": "KP",
  "kansanliike suomen puolesta": "KSP",
  "keskusta": "Kesk.",
  "kokoomus": "Kok.",
  "kommunistinen työväenpuolue": "KTP",
  "kristillisdemokraatit": "KD",
  "liberaalipuolue": "Lib.",
  "liike nyt": "Liik.",
  "perussuomalaiset": "PS",
  "piraattipuolue": "PP",
  "rkp": "RKP",
  "sdp": "SDP",
  "seitsemän tähden liike": "STL",
  "sininen tulevaisuus": "Sin.",
  "sitoutumaton": "sit.",
  "suomen kansa ensin": "SKE",
  "suomen kommunistinen puolue": "SKP",
  "vasemmistoliitto": "Vas.",
  "vihreät": "Vihr.",
}


/*
 * Abbreviate (a party name)
 * See http://www.kielitoimistonohjepankki.fi/ohje/262
 */
@Pipe({
  name: 'abbreviate'
})
export class AbbreviatePipe implements PipeTransform {

  transform(value: string): string {
    // If a predefined abbreviation exists, use that
    if (value.toLocaleLowerCase('fi-FI') in ABBREVIATIONS) {
      return ABBREVIATIONS[value.toLocaleLowerCase('fi-FI')];
    // Else if the word is longer enough, cut and insert a period
    } else if (value.length >= ABBREVIATION_MIN_LENGTH) {
      return value.substring(0, DEFAULT_ABBREVIATION_LENGTH) + '.';
    // Or do nothing
    } else {
      return value;
    }
  }
}
