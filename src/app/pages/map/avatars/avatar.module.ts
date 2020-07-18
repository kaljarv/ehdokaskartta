import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AvatarComponent } from './avatar.component';
import { PartyAvatarComponent } from './party-avatar.component';
import { PersonAvatarComponent } from './person-avatar.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
  ],
  exports: [
    AvatarComponent,
    PartyAvatarComponent,
    PersonAvatarComponent,
  ],
  declarations: [
    AvatarComponent,
    PartyAvatarComponent,
    PersonAvatarComponent,
  ],
})
export class AvatarModule {}