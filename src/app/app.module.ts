import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { PrecinctPickerComponent } from './precinct-picker/precinct-picker.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { MatcherService } from './core/matcher.service';
import { QuestionListComponent } from './question-list/question-list.component';
import { SharedService, MAP_PATH, QUESTIONS_PATH } from './core/shared.service';
import { DetailsQuestionComponent } from './details-question/details-question.component';
import { D3Service  } from './d3/d3.service';
import { DistributionChartComponent, BarBlockComponent } from './d3/distribution-chart.component';
import { MapComponent, CandidateAvatarComponent, VoterAvatarComponent } from './map/map.component';
import { DetailsCandidateComponent } from './details-candidate/details-candidate.component';
import { CandidateAnswerComponent } from './details-candidate/candidate-answer.component';
import { ProgressSpinnerComponent } from './shared/progress-spinner/progress-spinner.component';
import { CustomExpanderModule } from './shared/custom-expander/custom-expander.module';
import { FadeoutExpanderComponent } from './shared/fadeout-expander/fadeout-expander.component';
import { LcFirstPipe } from './core/lc-first.pipe';
import { UcFirstPipe } from './core/uc-first.pipe';
import { SentencifyPipe } from './core/sentencify.pipe';
import { FixSpacesPipe } from './core/fix-spaces.pipe';
import { FixListPipe } from './core/fix-list.pipe';
import { FilterCandidatesComponent } from './filter-candidates/filter-candidates.component';



/* RESOURCES
 * - https://medium.com/netscape/visualizing-data-with-angular-and-d3-209dde784aeb
 * - https://observablehq.com/@d3/stacked-bar-chart
 * 
 * TODO
 * - How to treat voter's answer 3 in relation to candidates
 * - Save filters in cookie
 * - Save app version in cookie to handle errors
 * - Add badges to filter button
 * - Add exclude missing to range filter
 * - Add distributions to filters
 * - Add explanation on the first missing candidate answer in 'disagreed'
 * - Add title screen
 * - Add map-based municipality/precinct choice
 * - Check glitch with fadeout-expander on 2+ candidate
 * - Move all election-specific data from Matcher to data files
 * - Convert PARTY_STRINGS to a Pipe
 * - Refactor candidate-answer to use avatars
 * - Add crown to self
 * - Add candidate avatars on zoom
 *   Grey body, party colour head
 * - Add party centroids as flags on map
 * - Click on voter avatar to change replies
 * - Move component-specific styles to component css files
 * - Refactor indented styles to nicer ones
 * - Move avatars in the same place apart
 * - Move avatars away from behing the voter
 * - Convert opinion distribution in questions to dots
 * - Implement favourites
 * - Implement badge for candidates and opinions that disagree with the party average
 * - Set a min threshold for map zoom (with wheel) as now small zoom is annoying
 * - Make candidate header in details sticky
 * - Enable question ordering based on entropy
 * - Enable filters for map view
 * - Enable deleting of question answer
 * - Enable question prioritizing 
 * - Convert EventEmitters to Outputs and/or Observables/Subjects
 * - Allow dynamic language choice (cf Locale specific string functions + base lang in html tag)
 * - Convert collections into modules, such as, core/pipes
 */

const paths = [
  /* '' setPrecinct
      'questions',
      +'question/ID' 
      +'candidate/ID' 
      
    { path: ':type/:id', 
    outlet: 'details',
    component: DetailsComponent },
  */
  { path: '', 
    // component: HelloComponent },
    component: PrecinctPickerComponent },
  { path: QUESTIONS_PATH, 
    component: QuestionListComponent },
  { path: 'test',
    component: DetailsQuestionComponent },
  { path: MAP_PATH,
    component: MapComponent },
];

@NgModule({
  imports:      [ BrowserModule,
                  BrowserAnimationsModule,
                  FormsModule,
                  HttpClientModule,
                  MatAutocompleteModule,
                  MatBadgeModule,
                  MatBottomSheetModule,
                  MatButtonModule,
                  MatCardModule,
                  MatCheckboxModule,
                  MatChipsModule,
                  MatDividerModule,
                  MatExpansionModule,
                  MatFormFieldModule,
                  MatIconModule,
                  MatInputModule,
                  MatListModule,
                  MatMenuModule,
                  MatProgressSpinnerModule,
                  MatRadioModule,
                  MatSidenavModule,
                  MatSliderModule,
                  MatTabsModule,
                  MatToolbarModule,
                  MatTooltipModule,
                  ReactiveFormsModule,
                  RouterModule.forRoot(paths),
                  CustomExpanderModule ],
  entryComponents: [],
  declarations: [ AppComponent,
                  PrecinctPickerComponent,
                  HelloComponent,
                  TopBarComponent,
                  QuestionListComponent,
                  DetailsQuestionComponent,
                  DistributionChartComponent,
                  BarBlockComponent,
                  MapComponent,
                  CandidateAvatarComponent,
                  VoterAvatarComponent,
                  DetailsCandidateComponent,
                  CandidateAnswerComponent,
                  ProgressSpinnerComponent,
                  FadeoutExpanderComponent,
                  LcFirstPipe,
                  UcFirstPipe,
                  SentencifyPipe,
                  FixSpacesPipe,
                  FixListPipe,
                  FilterCandidatesComponent, ],
  bootstrap:    [ AppComponent ],
  providers:    [ MatcherService, 
                  SharedService,
                  D3Service,
                  CookieService,
                  LcFirstPipe,
                  UcFirstPipe,
                  SentencifyPipe,
                  FixSpacesPipe,
                  FixListPipe, ]
})
export class AppModule {
}
