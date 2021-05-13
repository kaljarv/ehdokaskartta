import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule } from '../../../core';
import { 
  MapCanvasModule,
  OnboardingModule 
} from '../../../components';

import { DetailsCandidateModule } from '../details-candidate';
import { FavouritesListModule } from '../favourites-list';
import { FilterCandidatesModule } from '../filter-candidates';

import { MapComponent } from './map.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    MatMenuModule,
    MatTooltipModule,
    CorePipesModule,
    MapCanvasModule,
    OnboardingModule,
    DetailsCandidateModule,
    FavouritesListModule,
    FilterCandidatesModule,
  ],
  exports: [
    MapComponent
  ],
  declarations: [
    MapComponent
  ],
})
export class MapModule {}