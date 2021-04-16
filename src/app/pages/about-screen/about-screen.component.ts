import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SharedService } from '../../core';


@Component({
  selector: 'app-about-screen',
  templateUrl: './about-screen.component.html',
  styleUrls: ['./about-screen.component.sass']
})
export class AboutScreenComponent {

  constructor(
    private router: Router,
    private shared: SharedService,
  ) {
    this.shared.hideTopBar = true;
  }

  public toggleSideNav(event: MouseEvent): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }

  public goToStart(): void {
    this.router.navigate(['']);
  }

}
