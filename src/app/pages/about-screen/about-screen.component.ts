import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { 
  SharedService,
  ADMIN_EMAIL 
} from '../../core';


@Component({
  selector: 'app-about-screen',
  templateUrl: './about-screen.component.html',
  styleUrls: ['./about-screen.component.sass']
})
export class AboutScreenComponent {

  public adminEmail = ADMIN_EMAIL;

  constructor(
    private router: Router,
    private shared: SharedService,
  ) {
    this.shared.reportPageOpen({
      currentPage: 'about',
      subtitle: null,
      hideTopBar: true
    });
  }

  public toggleSideNav(event: MouseEvent): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }

  public goToStart(): void {
    this.router.navigate(['']);
  }

}
