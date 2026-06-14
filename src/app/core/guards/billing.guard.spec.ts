import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { billingAccessGuard, billingCheckoutGuard } from './billing.guard';
import { AuthStore } from '../state/auth.store';
import { BillingStore } from '../state/billing.store';

describe('billing guards', () => {
	const adminUser = {
		id: 'admin-1',
		email: 'admin@example.com',
		admin: true
	};

	let authStore: any;
	let billingStore: any;
	let router: any;
	let workspaceTree: UrlTree;

	beforeEach(() => {
		workspaceTree = {} as UrlTree;
		authStore = {
			isAuthenticated: vi.fn(() => true),
			currentUser: vi.fn(() => adminUser)
		};
		billingStore = {
			refreshEntitlement: vi.fn()
		};
		router = {
			createUrlTree: vi.fn(() => workspaceTree)
		};

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthStore, useValue: authStore },
				{ provide: BillingStore, useValue: billingStore },
				{ provide: Router, useValue: router }
			]
		});
	});

	it('redirects admin users from paywall to workspace', () => {
		const result = TestBed.runInInjectionContext(() => billingCheckoutGuard({} as never, {} as never));

		expect(result).toBe(workspaceTree);
		expect(router.createUrlTree).toHaveBeenCalledWith(['/workspace']);
		expect(billingStore.refreshEntitlement).not.toHaveBeenCalled();
	});

	it('allows admin users into the workspace route', () => {
		const result = TestBed.runInInjectionContext(() => billingAccessGuard({} as never, {} as never));

		expect(result).toBe(true);
		expect(billingStore.refreshEntitlement).not.toHaveBeenCalled();
	});
});