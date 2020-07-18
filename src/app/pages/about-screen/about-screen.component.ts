import { Component, 
         OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SharedService } from '../../core';


@Component({
  selector: 'app-about-screen',
  templateUrl: './about-screen.component.html',
  styleUrls: ['./about-screen.component.sass']
})
export class AboutScreenComponent implements OnInit {

  constructor(
    private router: Router,
    private shared: SharedService,
  ) {}

  ngOnInit(): void {
    this.shared.hideTopBar.emit();
  }

  public toggleSideNav(event: MouseEvent): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }

  public goToStart(): void {
    this.router.navigate(['']);
  }

}
