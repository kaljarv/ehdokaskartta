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
import { LikertAnswerComponent } from './likert-answer.component';
import { PreferenceOrderAnswerComponent } from './preference-order-answer.component';

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
    FloatingCardModule
  ],
  exports: [
    CandidateAnswerComponent,
    DetailsCandidateComponent,
    LikertAnswerComponent,
    PreferenceOrderAnswerComponent
  ],
  declarations: [
    CandidateAnswerComponent,
    DetailsCandidateComponent,
    DetailsCandidateGlobalStylesComponent,
    LikertAnswerComponent,
    PreferenceOrderAnswerComponent
  ]
})
export class DetailsCandidateModule {}