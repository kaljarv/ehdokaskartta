import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule } from '../../core';
import { ProgressSpinnerModule } from '../../components';

import { DetailsCandidateModule } from './details-candidate';
import { FavouritesListModule } from './favourites-list';
import { FilterCandidatesModule } from './filter-candidates';

import { MapComponent } from './map.component';
import { MapCanvasComponent } from './map-canvas.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    MatMenuModule,
    MatTooltipModule,
    CorePipesModule,
    ProgressSpinnerModule,
    DetailsCandidateModule,
    FavouritesListModule,
    FilterCandidatesModule,
  ],
  exports: [
    MapComponent,
    MapCanvasComponent,
  ],
  declarations: [
    MapComponent,
    MapCanvasComponent,
  ],
})
export class MapModule {}