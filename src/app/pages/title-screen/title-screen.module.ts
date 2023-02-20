import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// import { LottieModule } from 'ngx-lottie';

// import { OnboardingModule } from '../../components';

// Note we need a separate function as it's required by the AOT compiler.
// export function playerFactory() {
//   return import('lottie-web');
// }

import { TitleScreenComponent } from './title-screen.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    // LottieModule.forRoot({ player: playerFactory }),
    // OnboardingModule
  ],
  exports: [
    TitleScreenComponent,
  ],
  declarations: [
    TitleScreenComponent,
  ],
})
export class TitleScreenModule {}