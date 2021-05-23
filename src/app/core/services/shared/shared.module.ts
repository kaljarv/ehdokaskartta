import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CookieModule } from '../cookie';
import { DatabaseModule } from '../database';
import { MatcherModule } from '../matcher';

import { SharedService } from './shared.service';

@NgModule({
  imports: [
    CommonModule,
    CookieModule,
    DatabaseModule,
    MatcherModule
  ],
  providers: [
    SharedService
  ],
})
export class SharedModule {}