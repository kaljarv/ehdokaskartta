import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CookieModule } from '../cookie';
import { DatabaseModule } from '../database';

import { MatcherService } from './matcher.service';

@NgModule({
  imports: [
    CommonModule,
    CookieModule,
    DatabaseModule
  ],
  providers: [
    MatcherService
  ],
})
export class MatcherModule {}