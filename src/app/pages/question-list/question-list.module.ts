import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule } from '../../core';

import { QuestionListComponent } from './question-list.component';
import { QuestionListTopBarContentComponent } from './question-list-top-bar-content.component';
import { DetailsQuestionModule } from './details-question';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    CorePipesModule,
    DetailsQuestionModule
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