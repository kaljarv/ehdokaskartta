import { Pipe, PipeTransform } from '@angular/core';


/*
 * Make a tidy link for display
 */
@Pipe({
  name: 'tidyLink'
})
export class TidyLinkPipe implements PipeTransform {
  transform(value: string): string {
    if (value == null) return '';
    return value.toString().replace(/^[a-z]+:\/{2,3}/i, '');
  }
}
