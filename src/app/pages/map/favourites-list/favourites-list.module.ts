import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { CoreDirectivesModule,
         CorePipesModule } from '../../../core';

import { FavouritesListComponent } from './favourites-list.component';

@NgModule({
  imports: [
    CommonModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    CoreDirectivesModule,
    CorePipesModule,
  ],
  exports: [
    FavouritesListComponent,
  ],
  declarations: [
    FavouritesListComponent,
  ],
  entryComponents: [
    FavouritesListComponent,
  ]
})
export class FavouritesListModule {}