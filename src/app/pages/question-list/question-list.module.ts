import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule,
         OnboardingModule } from '../../core';

import { QuestionListComponent } from './question-list.component';
import { QuestionListTopBarContentComponent } from './question-list-top-bar-content.component';
import { DetailsQuestionModule } from './details-question';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatRippleModule,
    MatTooltipModule,
    CorePipesModule,
    DetailsQuestionModule,
    OnboardingModule
  ],
  exports: [
    QuestionListComponent,
    QuestionListTopBarContentComponent,
  ],
  declarations: [
    QuestionListComponent,
    QuestionListTopBarContentComponent,
  ],
})
export class QuestionListModule {}