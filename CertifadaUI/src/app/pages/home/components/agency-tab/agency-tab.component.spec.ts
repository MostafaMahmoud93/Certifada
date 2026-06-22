import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyTabComponent } from './agency-tab.component';

describe('AgencyTabComponent', () => {
  let component: AgencyTabComponent;
  let fixture: ComponentFixture<AgencyTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgencyTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
