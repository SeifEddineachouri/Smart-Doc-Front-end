import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { PaymentCheckoutSessionRequest } from '../../../core/models';
import { AuthStore } from '../../../core/state/auth.store';
import { BillingStore } from '../../../core/state/billing.store';
import { PaymentService } from '../../../core/api/payment.service';

type BillingPlanId = 'starter' | 'pro';

interface BillingPlanOption {
	id: BillingPlanId;
	nameKey: string;
	descriptionKey: string;
	price: string;
	featureKeys: string[];
	recommended?: boolean;
}

@Component({
	selector: 'app-billing-checkout',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './billing-checkout.component.html',
	styleUrl: './billing-checkout.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
	export class BillingCheckoutComponent implements OnInit {
	private readonly translate = inject(TranslateService);
	private readonly authStore = inject(AuthStore);
	private readonly billingStore = inject(BillingStore);
	private readonly paymentService = inject(PaymentService);
	private readonly router = inject(Router);

	protected readonly isCheckoutLoading = signal(false);
	protected readonly checkoutError = signal<string | null>(null);
	protected readonly selectedPlanId = signal<BillingPlanId>('starter');
	protected readonly plans: BillingPlanOption[] = [
		{
			id: 'starter',
			nameKey: 'billing.plans.starter.name',
			descriptionKey: 'billing.plans.starter.description',
			price: '$29',
			featureKeys: [
				'billing.plans.starter.features.0',
				'billing.plans.starter.features.1',
				'billing.plans.starter.features.2'
			]
		},
		{
			id: 'pro',
			nameKey: 'billing.plans.pro.name',
			descriptionKey: 'billing.plans.pro.description',
			price: '$79',
			recommended: true,
			featureKeys: [
				'billing.plans.pro.features.0',
				'billing.plans.pro.features.1',
				'billing.plans.pro.features.2'
			]
		}
	];

	protected readonly selectedPlan = computed(() => this.plans.find((plan) => plan.id === this.selectedPlanId()) ?? this.plans[0]);
	protected readonly entitlement = this.billingStore.entitlement;
	protected readonly hasAccess = this.billingStore.hasAccess;
	protected readonly statusKey = this.billingStore.statusKey;
	protected readonly activePlanName = this.billingStore.activePlanName;
	protected readonly isRefreshingEntitlement = this.billingStore.isLoading;

	public ngOnInit(): void {
		this.refreshEntitlement();
	}

	protected selectPlan(planId: BillingPlanId): void {
		this.selectedPlanId.set(planId);
	}

	protected startCheckout(): void {
		this.checkoutError.set(null);

		const user = this.requireCurrentUser();
		if (!user) {
			return;
		}

		this.isCheckoutLoading.set(true);

		const request: PaymentCheckoutSessionRequest = {
			userId: user.id,
			planId: this.selectedPlan().id,
			idempotencyKey: this.buildIdempotencyKey(user.id, this.selectedPlan().id),
			successUrl: this.buildReturnUrl('/billing/success'),
			cancelUrl: this.buildReturnUrl('/billing/cancel'),
			customerEmail: user.email
		};

		this.paymentService
			.createCheckoutSession(request)
			.pipe(finalize(() => this.isCheckoutLoading.set(false)))
			.subscribe({
				next: (response) => {
					if (response.checkoutUrl) {
						this.redirectToCheckout(response.checkoutUrl);
						return;
					}

					this.router.navigate(['/workspace']);
				},
				error: (error: unknown) => {
					this.checkoutError.set(this.extractApiErrorMessage(error));
				}
			});
	}

	protected refreshEntitlement(): void {
		const user = this.requireCurrentUser();
		if (!user) {
			return;
		}

		this.billingStore.refreshEntitlement(user.id).subscribe({
			next: (entitlement) => {
				if (entitlement.planId === 'starter' || entitlement.planId === 'pro') {
					this.selectedPlanId.set(entitlement.planId);
				}
			},
			error: () => {
				// Keep the paywall usable even if the entitlement endpoint is down.
			}
		});
	}

	protected goToWorkspace(): void {
		this.router.navigate(['/workspace']);
	}

	protected goToBilling(): void {
		this.router.navigate(['/billing']);
	}

	private requireCurrentUser() {
		const user = this.authStore.currentUser();

		if (!user?.id) {
			this.router.navigate(['/sign-in']);
			return null;
		}

		return user;
	}

	private buildIdempotencyKey(userId: string, planId: BillingPlanId): string {
		const uniquePart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
		return `${userId}:${planId}:${uniquePart}`;
	}

	private buildReturnUrl(path: string): string {
		const origin = globalThis.window?.location.origin ?? 'http://localhost:4200';
		return new URL(path, origin).toString();
	}

	private redirectToCheckout(checkoutUrl: string): void {
		const browserWindow = globalThis.window;

		if (browserWindow) {
			browserWindow.location.assign(checkoutUrl);
			return;
		}

		this.router.navigate(['/billing']);
	}

	private extractApiErrorMessage(error: unknown): string {
		if (typeof error === 'object' && error !== null) {
			const backendMessage = (error as { error?: { message?: unknown } }).error?.message;

			if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
				return backendMessage;
			}

			const message = (error as { message?: unknown }).message;

			if (typeof message === 'string' && message.trim().length > 0) {
				return message;
			}
		}

		return this.translate.instant('billing.checkoutError');
	}
}