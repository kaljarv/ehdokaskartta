import { 
  AfterViewInit,
  Component, 
  ComponentFactoryResolver,
  ElementRef,
  OnDestroy,
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
  Subscription
} from 'rxjs';

import { 
  ANIMATION_TIMING,
  PATHS,
  PageName,
  SharedService
} from '../../core';

export const DEFAULT_TOP_BAR_NEXT_ELEMENT_OFFSET: {top: number, left: number} = {
  top: 56 + 2 * 16,
  left: 16
}

export const EXPANSION_CHANGE_TIMEOUT_MS: number = 25;

/*
 * <app-top-bar>
 * @Input title is the main title text
 * @Input content is the content and can be either text or a component which is inserted dynamically
 * 
 * TODO:
 * - Remove the ugly setTimeouts and replace with event listener to component loaded
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
export class TopBarComponent 
  implements AfterViewInit, OnDestroy, OnInit {

  @ViewChild('contentTemplate', {read: ViewContainerRef}) contentTemplate: ViewContainerRef;
  @ViewChild('header') header: ElementRef<HTMLElement>;
  @ViewChild('stringContentTemplate', {read: TemplateRef}) stringContentTemplate: TemplateRef<undefined>;

  private _componentWaiting: boolean = false;
  private _destroyed: boolean = false;
  private _expanded: boolean = true;
  private _prevContent: string | Type<any>;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private host: ElementRef,
    private router: Router,
    private shared: SharedService,
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

  get expanded(): boolean {
    return this.hasContent && this._expanded;
  }

  set expanded(value: boolean) {
    this._expanded = value;
  }

  get hasContent(): boolean {
    return this.content != null;
  }

  get voterDisabled(): boolean {
    return this.shared.voterDisabled;
  }

  ngOnInit() {
    this._subscriptions.push(this.shared.minimiseTopBar.subscribe(() => this.minimise()));
    this._subscriptions.push(this.shared.topBarDataChanged.subscribe(() => this._updateContent()));
  }

  ngAfterViewInit() {
    this._updateContent();
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;

    this._destroyed = true;
    this.emitExpansionChange();

    this.contentTemplate = null;
    this.header = null;
    this.stringContentTemplate = null;
    this._prevContent = null;
    this.componentFactoryResolver = null;
    this.host = null;
  }

  private _updateContent(): void {

    let hasChanged = false;
    
    // Check if content has changed
    if (this._prevContent !== this.content) {
      this._prevContent = this.content;
      // We set this flag, as the ng-template may not have yet initialized
      if (this.hasContent)
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

        // We have to recheck here, because top bar might've been cleared
        // during the timeout
        if (!this.contentTemplate)
          return;

        this.contentTemplate.clear();
      
        if (this.content == null || typeof this.content === 'string') {
          this.contentTemplate.createEmbeddedView(this.stringContentTemplate);
        } else {
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.content as Type<any>);
          this.contentTemplate.createComponent(componentFactory);
        }

        this.emitExpansionChange();

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

  /*
   * Returns offsetTop and offsetLeft for an element based under the top bar
   */
  public getOffsetForNextElement(includeExpansion: boolean = false): {top: number, left: number} {
    if (this.host?.nativeElement && this.header?.nativeElement)
      return {
        top: (includeExpansion ? this.host : this.header).nativeElement.offsetHeight + 2 * this.host.nativeElement.offsetTop,
        left: this.host.nativeElement.offsetLeft
      }
    return DEFAULT_TOP_BAR_NEXT_ELEMENT_OFFSET;
  }

  public emitExpansionChange(): void {

    // We add a timeout here for the content to load
    // TODO: Refactor to get rid of timeout
    setTimeout(() => {
      const state = this._destroyed ? 'destroyed' : 
                    this.expanded ? 'open' : 'closed';
      const setToZero = state === 'destroyed';
      this._updateOffset(setToZero);
      this.shared.topBarExpansionChanged.emit(state);
    }, EXPANSION_CHANGE_TIMEOUT_MS);
  }

  private _updateOffset(setToZero: boolean = false): void {
    if (setToZero)
      this.shared.topBarOffset = {
        withExpansion: { top: 0, left: 0},
        withoutExpansion: { top: 0, left: 0},
      };
    else
      this.shared.topBarOffset = {
        withExpansion: this.getOffsetForNextElement(true),
        withoutExpansion: this.getOffsetForNextElement(false)
      };
  }

}