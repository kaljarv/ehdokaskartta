import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgressSpinnerComponent } from './progress-spinner.component';

/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [
    ProgressSpinnerComponent
  ],
  declarations: [
    ProgressSpinnerComponent
  ],
})
export class ProgressSpinnerModule {}