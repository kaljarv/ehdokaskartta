import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterCandidatesComponent } from './filter-candidates.component';

describe('FilterCandidatesComponent', () => {
  let component: FilterCandidatesComponent;
  let fixture: ComponentFixture<FilterCandidatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterCandidatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterCandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
