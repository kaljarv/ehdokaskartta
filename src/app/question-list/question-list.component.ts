import { Component, OnInit, AfterViewInit } from '@angular/core';

import { MatcherService, MIN_VALS_FOR_TSNE } from '../core/matcher.service';
import { SharedService, MAP_PATH } from '../core/shared.service';

export const MIN_ANSWERS_STRINGS = {
  1: 'yhteen',
  2: 'kahteen',
  3: 'kolmeen',
  4: 'neljään',
  5: 'viiteen',
  6: 'kuuteen',
  7: 'seitsemään',
  8: 'kahdeksaan',
  9: 'yhdeksään',
  10: 'kymmeneen'
};

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.css']
})
export class QuestionListComponent implements OnInit, AfterViewInit {
  questions;

  constructor(
    private matcher: MatcherService,
    private shared: SharedService
  ) { 
    // questionData includes voter answers
    this.matcher.questionDataUpdated$.subscribe(() => this.checkEnableForward());
    this.matcher.questionDataReady$.subscribe(() => this.fetchQuestions());
  }

  fetchQuestions() {
    this.questions = this.matcher.getLikertQuestionsAsList();
  }

  ngOnInit() {
    this.shared.title = "Vastaa niihin kysymyksiin, jotka ovat sinulle tärkeitä.";
    this.shared.subtitle = `Mitä useampaan vastaat, sitä tarkemmat tulokset ovat. Vastaa ainakin ${MIN_VALS_FOR_TSNE > 10 ? MIN_VALS_FOR_TSNE: MIN_ANSWERS_STRINGS[MIN_VALS_FOR_TSNE]} kysymykseen.`;
  }

  ngAfterViewInit() {
    // Need to check it here as the subscriptions won't catch reading data from cookie, which happens at matcher service initialization
    this.checkEnableForward();
  }

  showQuestion(question) {
    this.shared.showQuestion.emit(question.id);
  }

  getClassName(question) {
    return 'category-' + this.shared.toClassName(question.category);
  }

  checkEnableForward() {
    if (this.matcher.countVoterAnswers() >= MIN_VALS_FOR_TSNE ) {
      this.shared.enableForward.emit({path: [MAP_PATH]});
    }
  }
}