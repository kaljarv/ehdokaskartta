import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot,
         CanDeactivate,
         RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';


export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(
    component: CanComponentDeactivate, 
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ) {
     return component.canDeactivate ? component.canDeactivate() : true;
  }
} 