import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { SurveyDialogComponent } from './survey-dialog.component';


/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule
  ],
  exports: [
    SurveyDialogComponent,
  ],
  declarations: [
    SurveyDialogComponent,
  ],
})
export class SurveyDialogModule {}