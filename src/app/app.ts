import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageCode, normalizeLanguageCode, SUPPORTED_LANGUAGES } from './core/models';

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
  private readonly document = inject(DOCUMENT);

  public constructor() {
    this.translate.addLangs([...SUPPORTED_LANGUAGES]);
    this.translate.setFallbackLang('en');

    const browserLang = normalizeLanguageCode(this.translate.getBrowserLang());

    if (isPlatformBrowser(this.platformId)) {
      this.applyDocumentLanguage(browserLang);
      this.translate.use(browserLang);

      this.translate.onLangChange.subscribe(({ lang }) => {
        this.applyDocumentLanguage(normalizeLanguageCode(lang));
      });
    }
  }

  private applyDocumentLanguage(lang: LanguageCode): void {
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
