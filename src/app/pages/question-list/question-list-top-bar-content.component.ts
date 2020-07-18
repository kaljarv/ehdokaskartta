import { Component } from '@angular/core';

import { PATHS } from '../../core/services/shared'; 

@Component({
  selector: 'question-list-top-bar-content',
  templateUrl: './question-list-top-bar-content.component.html',
  styleUrls: ['./question-list-top-bar-content.component.sass'],
})
export class QuestionListTopBarContentComponent {
  public paths = PATHS;

  constructor() {}
}