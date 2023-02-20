import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule } from '../../core';
// import { OnboardingModule } from '../../components';

import { OnlineQuestionListComponent } from './online-question-list.component';
// import { QuestionListComponent } from './question-list.component';
import { QuestionListTopBarContentComponent } from './question-list-top-bar-content.component';
// import { DetailsQuestionModule } from './details-question';
import { OnlineQuestionModule } from './online-question';

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
    // DetailsQuestionModule,
    OnlineQuestionModule,
    // OnboardingModule
  ],
  exports: [
    OnlineQuestionListComponent,
    // QuestionListComponent,
    QuestionListTopBarContentComponent,
  ],
  declarations: [
    OnlineQuestionListComponent,
    // QuestionListComponent,
    QuestionListTopBarContentComponent,
  ],
})
export class QuestionListModule {}