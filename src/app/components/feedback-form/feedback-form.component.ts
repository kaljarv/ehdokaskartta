import { Component, 
         OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { MatcherService,
         SharedService } from '../../core';
import { DatabaseService,
         FeedbackItem } from '../../core/services/database';


@Component({
  selector: 'app-feedback-form',
  templateUrl: './feedback-form.component.html',
  styleUrls: ['./feedback-form.component.sass']
})
export class FeedbackFormComponent implements OnInit {
  public feedbackText = new FormControl('');
  public email = new FormControl('');

  constructor(
    public dialogRef: MatDialogRef<FeedbackFormComponent>,
    private matcher: MatcherService,
    private shared: SharedService,
    private database: DatabaseService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.dialogRef.beforeClosed().subscribe( result => {
      if (result)
        this.saveFeedback();
    });
    if (this.shared.userEmail)
      this.email.setValue(this.shared.userEmail);
  }

  public saveFeedback(): void {
    let feedback: FeedbackItem = {
      text:  this.feedbackText.value,
      route: location.href,
      matcherState: this.matcher.state,
      sharedState: this.shared.state,
    };
    if (this.email.value) {
      this.shared.userEmail = this.email.value;
      feedback.email = this.email.value;
    }

    this.database.saveFeedback(
      feedback, 
      () => this.shared.showSnackBar.emit({ message: 'Kiitos palautteestasi!' }),
      () => this.shared.showSnackBar.emit({ message: 'Palautteen lähettäminen ei onnistunut!',
                                            emailTitle: 'Lähetä sähköpostitse',
                                            emailSubject: 'Palaute Ehdokaskartalta',
                                            emailBody: this.feedbackText.value })
    );
  }

}
