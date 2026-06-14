import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../core/api/auth.service';
import { SignInComponent } from './sign-in.component';

class FakeLoader implements TranslateLoader {
	public getTranslation(_lang: string): Observable<any> {
		return of({});
	}
}

describe('SignInComponent', () => {
	let authService: {
		signin: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		authService = {
			signin: vi.fn()
		};

		await TestBed.configureTestingModule({
			imports: [SignInComponent],
			providers: [
				provideRouter([]),
				provideTranslateService({
					loader: {
						provide: TranslateLoader,
						useClass: FakeLoader
					}
				}),
				{ provide: AuthService, useValue: authService }
			]
		}).compileComponents();
	});

	it('routes admin users directly to workspace', () => {
		authService.signin.mockReturnValue(
			of({
				accessToken: 'token',
				tokenType: 'Bearer',
				expiresIn: 3600,
				user: {
					id: 'admin-1',
					fullName: 'Admin User',
					email: 'admin@example.com',
					language: 'en',
					admin: true
				}
			})
		);

		const fixture = TestBed.createComponent(SignInComponent);
		const component = fixture.componentInstance as SignInComponent & {
			signInForm: { setValue: (value: { email: string; password: string; rememberMe: boolean }) => void };
			submit: () => void;
		};
		const router = TestBed.inject(Router);
		const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

		component.signInForm.setValue({
			email: 'admin@example.com',
			password: 'password123',
			rememberMe: true
		});

		component.submit();

		expect(navigateSpy).toHaveBeenCalledWith(['/workspace']);
	});

	it('routes regular users to paywall', () => {
		authService.signin.mockReturnValue(
			of({
				accessToken: 'token',
				tokenType: 'Bearer',
				expiresIn: 3600,
				user: {
					id: 'user-1',
					fullName: 'Regular User',
					email: 'user@example.com',
					language: 'en',
					admin: false
				}
			})
		);

		const fixture = TestBed.createComponent(SignInComponent);
		const component = fixture.componentInstance as SignInComponent & {
			signInForm: { setValue: (value: { email: string; password: string; rememberMe: boolean }) => void };
			submit: () => void;
		};
		const router = TestBed.inject(Router);
		const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

		component.signInForm.setValue({
			email: 'user@example.com',
			password: 'password123',
			rememberMe: true
		});

		component.submit();

		expect(navigateSpy).toHaveBeenCalledWith(['/paywall']);
	});
});