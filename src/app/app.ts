import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  public constructor() {
    this.translate.addLangs(['en', 'fr']);
    this.translate.setFallbackLang('en');

    const browserLang = this.translate.getBrowserLang();
    const nextLang = browserLang === 'fr' ? 'fr' : 'en';

    if (isPlatformBrowser(this.platformId)) {
      this.translate.use(nextLang);
    }
  }
}
