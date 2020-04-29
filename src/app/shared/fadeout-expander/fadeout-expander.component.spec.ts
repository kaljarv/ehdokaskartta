import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FadeoutExpanderComponent } from './fadeout-expander.component';

describe('FadeoutExpanderComponent', () => {
  let component: FadeoutExpanderComponent;
  let fixture: ComponentFixture<FadeoutExpanderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FadeoutExpanderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FadeoutExpanderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
