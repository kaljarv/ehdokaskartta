import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FadeoutExpanderComponent } from './fadeout-expander.component';

/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
  ],
  exports: [
    FadeoutExpanderComponent
  ],
  declarations: [
    FadeoutExpanderComponent
  ],
})
export class FadeoutExpanderModule {}