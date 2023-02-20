import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CorePipesModule } from '../../../core';
// import { OnboardingModule } from '../../../components';

import { OnlineQuestionComponent,
         OnlineQuestionGlobalStylesComponent } from './online-question.component';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatTooltipModule,
    CorePipesModule,
    // OnboardingModule
  ],
  exports: [
    OnlineQuestionComponent,
  ],
  declarations: [
    OnlineQuestionComponent,
    OnlineQuestionGlobalStylesComponent,
  ],
})
export class OnlineQuestionModule {}