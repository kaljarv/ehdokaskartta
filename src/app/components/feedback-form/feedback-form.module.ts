import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,
         ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FeedbackFormComponent } from './feedback-form.component';


/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
  ],
  exports: [
    FeedbackFormComponent,
  ],
  declarations: [
    FeedbackFormComponent,
  ],
})
export class FeedbackFormModule {}