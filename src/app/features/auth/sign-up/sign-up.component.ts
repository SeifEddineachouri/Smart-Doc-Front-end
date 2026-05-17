import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageCode, normalizeLanguageCode, SignUpRequest } from '../../../core/models';
import { AuthService } from '../../../core/api/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent {
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = new FormBuilder();

  protected readonly currentLang = signal<LanguageCode>('en');
  protected readonly isSubmitting = signal(false);
  protected readonly signUpForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    workEmail: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    acceptedTerms: [false, Validators.requiredTrue]
  });

  protected readonly passwordStrength = computed(() => {
    const password = this.signUpForm.controls.password.value;

    if (password.length >= 12) {
      return 'auth.signUp.passwordStrength.strong';
    }

    if (password.length >= 8) {
      return 'auth.signUp.passwordStrength.moderate';
    }

    return 'auth.signUp.passwordStrength.weak';
  });

  public constructor() {
    this.currentLang.set(normalizeLanguageCode(this.translate.getCurrentLang() ?? this.translate.getBrowserLang()));
  }

  protected selectLanguage(lang: LanguageCode): void {
    if (this.currentLang() === lang) {
      return;
    }

    this.currentLang.set(lang);
    this.translate.use(lang);
  }

  protected submit(): void {
    this.signUpForm.markAllAsTouched();

    if (this.signUpForm.invalid) {
      return;
    }

    const payload = this.buildRequestPayload();

    this.isSubmitting.set(true);

    this.authService
      .signup(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/paywall']);
        }
      });
  }

  private buildRequestPayload(): SignUpRequest {
    return this.signUpForm.getRawValue();
  }
}
