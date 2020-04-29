import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';

import { SharedService } from '../core/shared.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnChanges {
  @Input() title: string;
  @Input() subtitle: string;
  @ViewChild('expansionPanel') expansionPanel: MatExpansionPanel;
  private _prevTitle = '';
  private _prevSubtitle = '';

  constructor(
    private shared: SharedService
  ) {}

  // Open the panel when the message is changed
  ngOnChanges() {
    let hasChanged = false;
    if (this._prevTitle != this.title) {
      this._prevTitle = this.title;
      hasChanged = true;
    }
    if (this._prevSubtitle != this.subtitle) {
      this._prevSubtitle = this.subtitle;
      hasChanged = true;
    }
    // Need to check if expansionPanel is not defined as OnChanges takes place before initialization
    // However, if it's not defined, it cannot be closed either
    if (hasChanged && this.expansionPanel) {
      this.expansionPanel.open();
    }
  }
}