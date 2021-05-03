import { Component } from '@angular/core';
import { MIN_VALS_FOR_MAPPING, PATHS } from '../../core';

@Component({
  selector: 'question-list-top-bar-content',
  templateUrl: './question-list-top-bar-content.component.html',
  styleUrls: ['./question-list-top-bar-content.component.sass'],
})
export class QuestionListTopBarContentComponent {
  
  public minAnswersForMapping = MIN_VALS_FOR_MAPPING;
  public paths = PATHS;

  constructor() {}
}