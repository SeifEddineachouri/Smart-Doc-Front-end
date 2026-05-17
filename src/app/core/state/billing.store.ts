import { Injectable, computed, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { PaymentEntitlementResponse } from '../models';
import { PaymentService } from '../api/payment.service';

const ALLOW_TRIAL_ACCESS = false;

@Injectable({ providedIn: 'root' })
export class BillingStore {
	private readonly entitlementSignal = signal<PaymentEntitlementResponse | null>(null);
	private readonly loadingSignal = signal(false);

	readonly entitlement = computed(() => this.entitlementSignal());
	readonly isLoading = computed(() => this.loadingSignal());
	readonly hasAccess = computed(() => this.isEntitled(this.entitlementSignal()));
	readonly statusKey = computed(() => this.resolveStatusKey(this.entitlementSignal()?.status ?? null, this.isLoading()));
	readonly activePlanName = computed(() => this.entitlementSignal()?.planName ?? null);

	public constructor(private readonly paymentService: PaymentService) {}

	refreshEntitlement(userId: string) {
		this.loadingSignal.set(true);

		return this.paymentService.getEntitlement(userId).pipe(
			tap((entitlement) => this.entitlementSignal.set(entitlement)),
			finalize(() => this.loadingSignal.set(false))
		);
	}

	refreshStatus(userId: string) {
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

	private resolveStatusKey(status: PaymentEntitlementResponse['status'] | null, loading: boolean): string {
		if (loading) {
			return 'billing.status.checking';
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
}