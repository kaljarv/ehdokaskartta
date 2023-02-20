import { Pipe, PipeTransform } from '@angular/core';

export const GENITIVES = {
  "Kokoomus":                               "Kokoomuksen",
  "Suomen Kommunistinen Puolue":            "Suomen Kommunistisen Puolueen",
  "Perussuomalaiset":                       "Perussuomalaisten",
  "RKP":                                    "RKP:n",
  "Seitsem\u00e4n t\u00e4hden liike":       "Seitsem\u00e4n t\u00e4hden liikkeen",
  "SDP":                                    "SDP:n",
  "Kansalaispuolue":                        "Kansalaispuolueen",
  "Kommunistinen Ty\u00f6v\u00e4enpuolue":  "Kommunistisen Ty\u00f6v\u00e4enpuolueen",
  "Feministinen puolue":                    "Feministisen puolueen",
  "Keskusta":                               "Keskustan",
  "Kristillisdemokraatit":                  "Kristillisdemokraattien",
  "Itsen\u00e4isyyspuolue":                 "Itsen\u00e4isyyspuolueen",
  "Sitoutumaton":                           "Sitoutumattomien",
  "Sininen tulevaisuus":                    "Sinisen tulevaisuuden",
  "Vasemmistoliitto":                       "Vasemmistoliiton",
  "Suomen Kansa Ensin":                     "Suomen Kansa Ensin -puolueen",
  "Vihre\u00e4t":                           "Vihreiden",
  "Piraattipuolue":                         "Piraattipuolueen",
  "Liberaalipuolue":                        "Liberaalipuolueen",
  "El\u00e4inoikeuspuolue":                 "El\u00e4inoikeuspuolueen",
  "Liike Nyt":                              "Liike Nyt -puolueen",
  "Kansanliike Suomen Puolesta":            "Kansanliikkeen Suomen Puolesta",
}


/*
 * Convert (a party name) to the genitive case 
 */
@Pipe({
  name: 'genitive'
})
export class GenitivePipe implements PipeTransform {

  transform(value: string, defaultSuffix: string = ':n'): string {
    if (value == null) return '';
    // If a predefined genitive exists, use that
    if (value in GENITIVES) {
      return GENITIVES[value];
    // Otherwise use a dummy generic 'genitive'
    } else {
      return value + defaultSuffix;
    }
  }
}
