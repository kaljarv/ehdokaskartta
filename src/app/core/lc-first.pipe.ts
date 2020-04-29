import { Pipe, PipeTransform } from '@angular/core';
/*
 * Convert first character in string to locale (Finnish) lowercase
 */
@Pipe({
  name: 'lcFirst'
})
export class LcFirstPipe implements PipeTransform {
  transform(value: any): string {
    let first, rest;
    [ first, ...rest ] = typeof value === 'string' ? value : value.toString();
    return [ first.toLocaleLowerCase('fi-FI'), ...rest ].join('');
  }
}
