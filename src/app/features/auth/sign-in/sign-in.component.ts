import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageCode, SignInRequest } from '../../../core/models';
import { AuthService } from '../../../core/api/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent {
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = new FormBuilder();

  protected readonly currentLang = signal<LanguageCode>('en');
  protected readonly isSubmitting = signal(false);
  protected readonly signInForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true]
  });

  public constructor() {
    this.currentLang.set(this.translate.getCurrentLang() === 'fr' ? 'fr' : 'en');
  }

  protected selectLanguage(lang: LanguageCode): void {
    if (this.currentLang() === lang) {
      return;
    }

    this.currentLang.set(lang);
    this.translate.use(lang);
  }

  protected submit(): void {
    this.signInForm.markAllAsTouched();

    if (this.signInForm.invalid) {
      return;
    }

    const payload = this.buildRequestPayload();

    this.isSubmitting.set(true);

    this.authService
      .signin(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/workspace']);
        }
      });
  }

  private buildRequestPayload(): SignInRequest {
    return this.signInForm.getRawValue();
  }
}
