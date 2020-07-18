import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CoreDirectivesModule,
         CorePipesModule } from '../../../core';
import { CustomExpanderModule,
         FadeoutExpanderModule,
         FloatingCardModule } from '../../../components';

import { CandidateAnswerComponent } from './candidate-answer.component';
import { DetailsCandidateComponent,
         DetailsCandidateGlobalStylesComponent } from './details-candidate.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    CoreDirectivesModule,
    CorePipesModule,
    CustomExpanderModule,
    FadeoutExpanderModule, 
    FloatingCardModule,
  ],
  exports: [
    CandidateAnswerComponent,
    DetailsCandidateComponent,
  ],
  declarations: [
    CandidateAnswerComponent,
    DetailsCandidateComponent,
    DetailsCandidateGlobalStylesComponent,
  ],
  entryComponents: [
    DetailsCandidateComponent,
    DetailsCandidateGlobalStylesComponent,
  ]
})
export class DetailsCandidateModule {}