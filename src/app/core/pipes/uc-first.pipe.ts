import { Pipe, PipeTransform } from '@angular/core';
/*
 * Convert first character in string to locale (Finnish) uppercase
 */
@Pipe({
  name: 'ucFirst'
})
export class UcFirstPipe implements PipeTransform {
  transform(value: any): string {
    let first, rest;
    [ first, ...rest ] = typeof value === 'string' ? value : value.toString();
    return [ first.toLocaleUpperCase('fi-FI'), ...rest ].join('');
  }
}
