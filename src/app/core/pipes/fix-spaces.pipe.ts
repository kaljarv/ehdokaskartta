import { Pipe, PipeTransform } from '@angular/core';

/*
 * Fixes spacing issues in strings, especially for with punctuation
 */
@Pipe({
  name: 'fixSpaces'
})
export class FixSpacesPipe implements PipeTransform {
  transform(value: any): string {
    if (value == null) return '';
    return (typeof value === 'string' ? value : value.toString())
              .replace(/\s+/g, " ") // Multiple spaces to one
              .replace(/ ?([,\.\;\:\!\?]) ?/g, "$1 ") // Punctuation ' . ' => '. '
              .replace(/([\.\,]) (\d)/g, "$1$2") // Decimals ', 6' = ',6'
              .replace(/ $/, ""); // Remove trailing space
  }
}
