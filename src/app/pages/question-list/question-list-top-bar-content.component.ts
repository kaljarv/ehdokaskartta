import { 
  Component,
  ElementRef
} from '@angular/core';
import { 
  MatcherService, 
  PATHS 
} from '../../core';

@Component({
  selector: 'question-list-top-bar-content',
  templateUrl: './question-list-top-bar-content.component.html',
  styleUrls: ['./question-list-top-bar-content.component.sass'],
})
export class QuestionListTopBarContentComponent {
  
  public paths = PATHS;

  constructor(
    private matcher: MatcherService,
    private host: ElementRef
  ) {}

  get minAnswersForMapping(): number {
    return this.matcher.config.minValsForMapping;
  }
}