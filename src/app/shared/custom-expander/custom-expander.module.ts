import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatIconModule } from '@angular/material/icon';
import { CustomExpanderComponent,
         CustomExpanderTitleDirective,
         CustomExpanderSubtitleDirective
       } from './custom-expander.component';

/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatIconModule,
  ],
  exports: [
    CustomExpanderComponent,
    CustomExpanderTitleDirective,
    CustomExpanderSubtitleDirective,
  ],
  declarations: [
    CustomExpanderComponent,
    CustomExpanderTitleDirective,
    CustomExpanderSubtitleDirective,
  ],
})
export class CustomExpanderModule {}