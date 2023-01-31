import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

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
import { 
  DatabaseModule,
  D3Service,
  MatcherModule,
  SharedModule,
  MATCHER_CONFIG,
  PATHS
} from './core';
import { 
  ConstituencyPickerComponent,
  ConstituencyPickerModule,
  ErrorScreenComponent,
  ErrorScreenModule,
  QuestionListComponent,
  QuestionListModule,
  ListComponent,
  ListModule,
  MapComponent,
  MapModule, 
  AboutScreenComponent,
  AboutScreenModule,
  TitleScreenComponent,
  TitleScreenModule 
} from './pages';
import { 
  FeedbackFormModule,
  FloatingCardModule,
  OnboardingModule,
  ProgressSpinnerModule,
  SurveyDialogModule,
  TopBarModule 
} from './components'


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
  { path: PATHS.error, 
    component: ErrorScreenComponent },
  { path: PATHS.questions, 
    component: QuestionListComponent },
  { path: PATHS.list,
    component: ListComponent },
  { path: PATHS.browseList,
    component: ListComponent,
    data: {
      voterDisabled: true
    }},
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
    SurveyDialogModule,
    TopBarModule,
    AboutScreenModule,
    ConstituencyPickerModule,
    ErrorScreenModule,
    ListModule,
    MapModule,
    MatcherModule,
    ProgressSpinnerModule,
    SharedModule,
    QuestionListModule,
    TitleScreenModule
  ],
  declarations: [ 
    AppComponent 
  ],
  bootstrap: [ 
    AppComponent 
  ],
  providers: [
    D3Service,
    {
      provide: MATCHER_CONFIG,
      useValue: {
        useMunicipalityAsConstituency: true
      }
    }
  ]
})
export class AppModule {}