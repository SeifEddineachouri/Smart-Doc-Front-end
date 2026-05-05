import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Observable, of } from 'rxjs';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

class FakeLoader implements TranslateLoader {
  public getTranslation(_lang: string): Observable<any> {
    return of({});
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideTranslateService({
          loader: {
            provide: TranslateLoader,
            useClass: FakeLoader
          }
        })
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet host', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
