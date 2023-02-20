import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CoreDirectivesModule,
         CorePipesModule } from '../../../core';
// import { OnboardingModule } from '../../../components';

import { DetailsCandidateModule } from '../details-candidate';
import { FavouritesListModule } from '../favourites-list';
import { FilterCandidatesModule } from '../filter-candidates';

import { ListComponent } from './list.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    ScrollingModule,
    CoreDirectivesModule,
    CorePipesModule,
    // OnboardingModule,
    DetailsCandidateModule,
    FavouritesListModule,
    FilterCandidatesModule,
  ],
  exports: [
    ListComponent
  ],
  declarations: [
    ListComponent
  ],
})
export class ListModule {}