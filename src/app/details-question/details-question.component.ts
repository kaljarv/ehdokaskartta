import { Component, Inject } from '@angular/core';

import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { MatcherService } from '../core/matcher.service';

@Component({
  selector: 'app-details-question',
  templateUrl: './details-question.component.html',
  styleUrls: ['./details-question.component.css']
})
export class DetailsQuestionComponent {
  public question;

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matcher: MatcherService
  ) {
    // let data = { id: 'Q4'};
    this.question = matcher.getQuestion(data.id);
  }

  dismiss(event: MouseEvent = null) {
    this.bottomSheetRef.dismiss();
    if (event != null) {
      event.preventDefault();
    }
  }

  openLink(event: MouseEvent): void {
    this.dismiss(event);
  }

  get voterAnswer() {
    let a = this.matcher.getVoterAnswer(this.question.id)
    return a ? a : null;
  }
  set voterAnswer(value: number) {
    this.matcher.setVoterAnswer(this.question.id, value);
    setTimeout(() => this.dismiss(), 250);
  }
}