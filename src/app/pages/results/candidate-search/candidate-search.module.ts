import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CoreDirectivesModule,
         CorePipesModule } from '../../../core';

import { CandidateSearchComponent } from './candidate-search.component';

@NgModule({
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    CoreDirectivesModule,
    CorePipesModule,
  ],
  exports: [
    CandidateSearchComponent,
  ],
  declarations: [
    CandidateSearchComponent,
  ],
})
export class CandidateSearchModule {}