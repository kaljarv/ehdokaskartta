import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ConstituencyPickerComponent } from './constituency-picker.component';
import { ConstituencyPickerTopBarContentComponent } from './constituency-picker-top-bar-content.component';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  exports: [
    ConstituencyPickerComponent,
    ConstituencyPickerTopBarContentComponent
  ],
  declarations: [
    ConstituencyPickerComponent,
    ConstituencyPickerTopBarContentComponent
  ],
})
export class ConstituencyPickerModule {}