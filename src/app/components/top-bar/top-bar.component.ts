import { Component, 
         ComponentFactoryResolver,
         Input,
         OnChanges,
         OnInit,
         Type,
         ViewChild,
         ViewContainerRef, } from '@angular/core';
import { trigger,
         style,
         state,
         animate,
         transition, } from '@angular/animations';

import { SharedService } from '../../core/services';

const ANIMATION_TIMING = "225ms cubic-bezier(0.4, 0, 0.2, 1)";

/*
 * <app-top-bar>
 * @Input title is the main title text
 * @Input content is the content and can be either text or a component which is inserted dynamically
 *        Remember to add the component to the module's EntryComponents
 */
@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.sass'],
  animations: [
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
export class TopBarComponent implements OnInit, OnChanges {
  @Input() title: string;
  @Input() content: string | Type<any>;
  @ViewChild('contentTemplate', {read: ViewContainerRef}) contentTemplate: ViewContainerRef;
  public expanded: boolean = true;
  private _prevContent: string | Type<any> = '';
  private _componentWaiting: boolean = false;

  constructor(
    public shared: SharedService,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {}

  ngOnInit() {
    this.shared.minimiseTopBar.subscribe(() => this.minimise());
  }

  // Handle loading of components to the content area
  // and expand the top bar if the content changes
  ngOnChanges() {

    let hasChanged = false;
    
    // Check if content has changed
    if (this._prevContent != this.content) {
      this._prevContent = this.content;
      if (this.contentIsComponent) {
        // We set this flag, as the ng-template may not have yet initialized
        this._componentWaiting = true;
      } else {
        hasChanged = true;
      }
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
    if (hasChanged) {
      this.expanded = true;
    }
  }

  get contentIsComponent(): boolean {
    return this.content && typeof this.content !== 'string';
  }

  private _loadComponent(): boolean {
    // We have to check if ng-template has already initialized
    // and we'll return true when we succesfully load the content component
    if (this.contentTemplate) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.content as Type<any>);
      this.contentTemplate.clear();
      this.contentTemplate.createComponent(componentFactory);
      return true;
      // const componentRef = viewContainerRef.createComponent(componentFactory);
      // (<AdComponent>componentRef.instance).data = adItem.data;
    } else {
      return false;
    }
  }


  public toggle(): void {
    this.expanded = !this.expanded;
  }

  public minimise(): void {
    this.expanded = false;
  }

  public onMenuButtonClick(event: MouseEvent): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }
}