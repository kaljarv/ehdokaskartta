import { 
  Component, 
  OnDestroy,
  OnInit 
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { 
  SharedService,
  SURVEY_URL
} from '../../core';


@Component({
  selector: 'app-feedback-form',
  templateUrl: './survey-dialog.component.html',
  styleUrls: ['./survey-dialog.component.sass']
})
export class SurveyDialogComponent 
  implements OnDestroy, OnInit {

  private _subscriptions:  Subscription[] = [];
    

  constructor(
    public dialogRef: MatDialogRef<SurveyDialogComponent>,
    private shared: SharedService
  ) {}

  ngOnInit(): void {
    this._subscriptions.push(this.dialogRef.beforeClosed().subscribe( result => {
      if (result)
        this.openSurvey();
      else
        this.shared.logEvent('survey_dialog_closed');
    }));
    this.shared.logEvent('survey_dialog_open');
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;

    this.dialogRef = null;
  }

  openSurvey(event?: Event): void {
    window.open(SURVEY_URL, '_blank');
    this.shared.logEvent('survey_url_open');
    this.shared.saveSurveyAnswered();
    event?.stopPropagation();
    this.dialogRef.close();
  }
}
