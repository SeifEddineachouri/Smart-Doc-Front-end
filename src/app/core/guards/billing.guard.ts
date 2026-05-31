import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { BillingStore } from '../state/billing.store';
import { isAdminUser } from '../security/billing-access';

export const billingAccessGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const billingStore = inject(BillingStore);
	const router = inject(Router);

	const user = authStore.currentUser();

	if (!authStore.isAuthenticated() || !user?.id) {
		return router.createUrlTree(['/sign-in']);
	}

	if (isAdminUser(user)) {
		return true;
	}

	return billingStore.refreshEntitlement(user.id).pipe(
		map((entitlement) => (entitlement.active || entitlement.status === 'trial' ? true : router.createUrlTree(['/paywall']))),
		catchError(() => of(router.createUrlTree(['/paywall'])))
	);
};

export const billingCheckoutGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const billingStore = inject(BillingStore);
	const router = inject(Router);

	const user = authStore.currentUser();

	if (!authStore.isAuthenticated() || !user?.id) {
		return router.createUrlTree(['/sign-in']);
	}

	if (isAdminUser(user)) {
		return router.createUrlTree(['/workspace']);
	}

	return billingStore.refreshEntitlement(user.id).pipe(
		map((entitlement) => (entitlement.active || entitlement.status === 'trial' ? router.createUrlTree(['/workspace']) : true)),
		catchError(() => of(true))
	);
};
