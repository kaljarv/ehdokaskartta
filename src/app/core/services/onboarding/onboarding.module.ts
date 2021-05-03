import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { ShepherdService } from 'angular-shepherd';

import { CookieModule } from '../cookie';

import { OnboardingService } from './onboarding.service';
import { OnboardingHintComponent } from './onboarding-hint.component';
import { OnboardingStepComponent } from './onboarding-step.component';
import { OnboardingTourComponent } from './onboarding-tour.component';

@NgModule({
  imports: [
    CommonModule,
    CookieModule,
    MatIconModule,
    RouterModule
  ],
  exports: [
    OnboardingHintComponent,
    OnboardingStepComponent,
    OnboardingTourComponent
  ],
  declarations: [
    OnboardingHintComponent,
    OnboardingStepComponent,
    OnboardingTourComponent
  ],
  providers: [
    OnboardingService,
    ShepherdService
  ],
})
export class OnboardingModule {}