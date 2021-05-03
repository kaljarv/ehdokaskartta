import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CookieService as NgxCookieService } from 'ngx-cookie-service';

import { CookieService } from './cookie.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    CookieService,
    NgxCookieService
  ],
})
export class CookieModule {}