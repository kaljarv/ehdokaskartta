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
    TopBarModule,
    AboutScreenModule,
    ConstituencyPickerModule,
    MapModule,
    QuestionListModule,
    TitleScreenModule
  ],
  entryComponents: [],
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

/* RESOURCES
* - https://medium.com/netscape/visualizing-data-with-angular-and-d3-209dde784aeb
* - https://observablehq.com/@d3/stacked-bar-chart
* 
* TODO
*
* - Check Firebase rules
* - Check on mobile
*
* - When closing About go to previous screen (and don't destroy component) -- Priority: 7
* - Click on unanswered question to confirm to go back to questions with the relevant one opened -- Priority: 4
* - How to treat voter's answer 3 in relation to candidates --- Priority: 5
* - Implement badge for candidates and opinions that disagree with the party average --- Priority: 5
* - Tentavive as this may result in problems when zoomed-in, maybe only move the view when zooming out is not necessary. Set zoom nicely when selecting a candidate --- Priority: 3
* - Tentative: Add candidate avatars on zoom: Grey body, party colour head --- Priority: 5
* - Add crown to self --- Priority: 6
* - Add distributions to filters --- Priority: 6
* - Add exclude missing to range filter --- Priority: 6
* - Add map-based municipality/constituency choice --- Priority: 6
* - Save app version in cookie to handle errors --- Priority: 6
* - Save filters in cookie --- Priority: 6
* - Enable question prioritizing --- Priority: 7
* - Allow dynamic language choice (cf Locale specific string functions + base lang in html tag) --- Priority: 9
* - Convert EventEmitters to Outputs and/or Observables/Subjects --- Priority: 9
*/