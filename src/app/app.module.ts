import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { CookieService } from 'ngx-cookie-service';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { DatabaseModule,
         D3Service,
         MatcherService,
         OnboardingModule,
         SharedService } from './core/services';
import { ConstituencyPickerComponent,
         ConstituencyPickerModule,
         QuestionListComponent,
         QuestionListModule,
         MapComponent,
         MapModule, 
         AboutScreenComponent,
         AboutScreenModule,
         TitleScreenComponent,
         TitleScreenModule } from './pages';
import { FeedbackFormModule,
         FloatingCardModule,
         ProgressSpinnerModule,
         TopBarModule } from './components'
import { PATHS } from './core/services/shared';



/*
 * Set locale
 */

import { registerLocaleData } from '@angular/common';
import localeFi from '@angular/common/locales/fi';
import localeFiExtra from '@angular/common/locales/extra/fi';
registerLocaleData(localeFi, 'fi-FI', localeFiExtra);


const paths = [
  { path: '', 
    component: TitleScreenComponent },
  { path: PATHS.about, 
    component: AboutScreenComponent },
  { path: PATHS.constituencyPicker, 
    component: ConstituencyPickerComponent },
  { path: PATHS.questions, 
    component: QuestionListComponent },
  { path: PATHS.map,
    component: MapComponent },
  { path: PATHS.browse,
    component: MapComponent,
    data: {
      voterDisabled: true
    }},
  { path: '**', 
    component: TitleScreenComponent },
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterModule.forRoot(paths),
    DatabaseModule, 
    FeedbackFormModule,
    FloatingCardModule,
    OnboardingModule,
    TopBarModule,
    AboutScreenModule,
    ConstituencyPickerModule,
    MapModule,
    ProgressSpinnerModule,
    QuestionListModule,
    TitleScreenModule
  ],
  declarations: [ 
    AppComponent 
  ],
  bootstrap: [ 
    AppComponent 
  ],
  // NB. DatabaseModule provides DatabaseService itself as well as Firebase services
  providers: [
    MatcherService, 
    SharedService,
    D3Service,
    CookieService
  ]
})
export class AppModule {}