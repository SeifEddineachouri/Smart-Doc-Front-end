import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, of, tap } from 'rxjs';
import { PaymentEntitlementResponse } from '../models';
import { PaymentService } from '../api/payment.service';
import { AuthStore } from './auth.store';
import { isAdminUser } from '../security/billing-access';

const ALLOW_TRIAL_ACCESS = false;

@Injectable({ providedIn: 'root' })
export class BillingStore {
	private readonly entitlementSignal = signal<PaymentEntitlementResponse | null>(null);
	private readonly loadingSignal = signal(false);
	private readonly authStore = inject(AuthStore);

	readonly entitlement = computed(() => this.entitlementSignal());
	readonly isLoading = computed(() => this.loadingSignal());
	readonly isAdmin = computed(() => isAdminUser(this.authStore.currentUser()));
	readonly hasAccess = computed(() => this.isAdmin() || this.isEntitled(this.entitlementSignal()));
	readonly statusKey = computed(() =>
		this.resolveStatusKey(this.entitlementSignal()?.status ?? null, this.isLoading(), this.isAdmin())
	);
	readonly activePlanName = computed(() => this.entitlementSignal()?.planName ?? null);

	public constructor(private readonly paymentService: PaymentService) {}

	refreshEntitlement(userId: string): Observable<PaymentEntitlementResponse> {
		if (this.isAdmin()) {
			const entitlement = this.buildAdminEntitlement();
			this.entitlementSignal.set(entitlement);
			return of(entitlement);
		}

		this.loadingSignal.set(true);

		return this.paymentService.getEntitlement(userId).pipe(
			tap((entitlement) => this.entitlementSignal.set(entitlement)),
			finalize(() => this.loadingSignal.set(false))
		);
	}

	confirmCheckout(sessionId: string, userId: string): Observable<PaymentEntitlementResponse> {
		if (this.isAdmin()) {
			const entitlement = this.buildAdminEntitlement();
			this.entitlementSignal.set(entitlement);
			return of(entitlement);
		}

		this.loadingSignal.set(true);

		return this.paymentService.confirmCheckout(sessionId, userId).pipe(
			tap((entitlement) => this.entitlementSignal.set(entitlement)),
			finalize(() => this.loadingSignal.set(false))
		);
	}

	refreshStatus(userId: string): Observable<PaymentEntitlementResponse> {
		if (this.isAdmin()) {
			const entitlement = this.buildAdminEntitlement();
			this.entitlementSignal.set(entitlement);
			return of(entitlement);
		}

		this.loadingSignal.set(true);

		return this.paymentService.getStatus(userId).pipe(
			tap((status) =>
				this.entitlementSignal.set({
					active: status.active,
					status: status.status,
					planId: status.planId,
					planName: null,
					amountCents: null,
					currency: null,
					updatedAt: status.updatedAt,
					expiresAt: status.expiresAt
				})
			),
			finalize(() => this.loadingSignal.set(false))
		);
	}

	clear(): void {
		this.entitlementSignal.set(null);
		this.loadingSignal.set(false);
	}

	private isEntitled(entitlement: PaymentEntitlementResponse | null): boolean {
		if (!entitlement) {
			return false;
		}

		if (entitlement.active) {
			return true;
		}

		return ALLOW_TRIAL_ACCESS && entitlement.status === 'trial';
	}

	private resolveStatusKey(status: PaymentEntitlementResponse['status'] | null, loading: boolean, isAdmin: boolean): string {
		if (loading) {
			return 'billing.status.checking';
		}

		if (isAdmin) {
			return 'billing.status.active';
		}

		switch (status) {
			case 'active':
				return 'billing.status.active';
			case 'trial':
				return 'billing.status.trial';
			case 'past_due':
				return 'billing.status.pastDue';
			case 'canceled':
				return 'billing.status.canceled';
			case 'refund':
				return 'billing.status.refund';
			case 'inactive':
			default:
				return 'billing.status.inactive';
		}
	}

	private buildAdminEntitlement(): PaymentEntitlementResponse {
		return {
			active: true,
			status: 'active',
			planId: null,
			planName: null,
			amountCents: null,
			currency: null,
			updatedAt: null,
			expiresAt: null
		};
	}
}
