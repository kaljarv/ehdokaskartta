import { 
  AfterViewInit,
  Component, 
  ComponentFactoryResolver,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { 
  trigger,
  style,
  state,
  animate,
  transition
} from '@angular/animations';
import { 
  Router
} from '@angular/router';

import { 
  ANIMATION_TIMING,
  PATHS,
  PageName,
  SharedService 
} from '../../core';

/*
 * <app-top-bar>
 * @Input title is the main title text
 * @Input content is the content and can be either text or a component which is inserted dynamically
 */
@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.sass'],
  animations: [
    trigger('labelAppear', [
      transition(':enter', [
        style({
          width: 0,
        }),
        animate(ANIMATION_TIMING, style({
          width: '*',
        }))
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMING, style({
          width: '0',
        }))
      ]),
    ]),
    trigger('toggleExpand', [
      state('open', 
        style({
          height: '*',
          paddingBottom: '*',
          paddingTop: '*',
        })),
      state('closed', 
        style({
          height: 0,
          paddingBottom: 0,
          paddingTop: 0,
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
    trigger('toggleRotate', [
      state('normal', 
        style({
          transform: 'rotate(0deg)',
        })),
      state('rotated', 
        style({
          transform: 'rotate(-180deg)',
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
  ]
})
export class TopBarComponent implements AfterViewInit, OnInit, OnChanges {

  @ViewChild('contentTemplate', {read: ViewContainerRef}) contentTemplate: ViewContainerRef;
  @ViewChild('stringContentTemplate', {read: TemplateRef}) stringContentTemplate: TemplateRef<undefined>;
  public expanded: boolean = true;

  private _prevContent: string | Type<any> = '';
  private _componentWaiting: boolean = false;

  constructor(
    private router: Router,
    private shared: SharedService,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {}

  get currentPage(): PageName {
    return this.shared.currentPage;
  }

  get content(): string | Type<any> {
    return this.shared.subtitle;
  }

  get enableQuestions(): boolean {
    return this.shared.enableQuestions;
  }

  get enableMap(): boolean {
    return this.shared.enableMap;
  }

  get voterDisabled(): boolean {
    return this.shared.voterDisabled;
  }

  ngAfterViewInit() {
    this.ngOnChanges();
  }

  ngOnInit() {
    this.shared.minimiseTopBar.subscribe(() => this.minimise());
  }

  // Handle loading of components to the content area
  // and expand the top bar if the content changes
  ngOnChanges() {

    let hasChanged = false;

    console.log(this.content);
    
    // Check if content has changed
    if (this._prevContent != this.content) {
      this._prevContent = this.content;
      // We set this flag, as the ng-template may not have yet initialized
      this._componentWaiting = true;
    }

    // Attempt to load component and clear waiting flag if succesful
    if (this._componentWaiting) {
      if (this._loadComponent()) {
        this._componentWaiting = false;
        hasChanged = true;
      }
    }

    // If there were changes (and in case of a component content we managed to load them)
    // expand the top bar
    if (hasChanged)
      this.expanded = true;
  }

  private _loadComponent(): boolean {
    // We have to check if ng-template has already initialized
    // and we'll return true when we succesfully load the content component
    if (this.contentTemplate) {

      // To ward off content changed after checked errors
      setTimeout(() => {
        this.contentTemplate.clear();
      
        if (this.content == null || typeof this.content === 'string') {
          this.contentTemplate.createEmbeddedView(this.stringContentTemplate);
        } else {
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.content as Type<any>);
          this.contentTemplate.createComponent(componentFactory);
        }
      }, 1);

      return true;

    } else {
      // Content template not yet instantiated, we'll have to reschedule change checking
      return false;
    }
  }

  public toggle(): void {
    this.expanded = !this.expanded;
  }

  public minimise(): void {
    this.expanded = false;
  }

  public onMenuButtonClick(event: Event): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }

  public followLink(linkName: string, event?: Event): void {
    switch (linkName) {
      case 'constituencyPicker':
        this.router.navigate([PATHS.constituencyPicker]);
        break;
      case 'questions':
        if (this.enableQuestions)
          this.router.navigate([PATHS.questions]);
        break;
      case 'map':
        // NB. We enable results even if no questions are answered
        if (this.enableQuestions)
          this.router.navigate([PATHS.map]);
        break;
    }
    if (event)
      event.stopPropagation();
  }
}