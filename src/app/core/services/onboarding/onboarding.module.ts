import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ShepherdService } from 'angular-shepherd';

import { OnboardingService } from './onboarding.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  providers: [
    OnboardingService,
    ShepherdService
  ],
})
export class OnboardingModule {}