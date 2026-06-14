import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, switchMap, takeWhile, timer } from 'rxjs';
import { AuthStore } from '../../../core/state/auth.store';
import { BillingStore } from '../../../core/state/billing.store';
import { isAdminUser } from '../../../core/security/billing-access';

type BillingReturnMode = 'success' | 'cancel';

@Component({
	selector: 'app-billing-return',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './billing-return.component.html',
	styleUrl: './billing-return.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingReturnComponent implements OnInit {
	private static readonly POLL_INTERVAL_MS = 2000;
	private static readonly MAX_POLL_ATTEMPTS = 15;

	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly authStore = inject(AuthStore);
	private readonly billingStore = inject(BillingStore);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly mode = (this.route.snapshot.data['mode'] as BillingReturnMode) ?? 'success';
	protected readonly isChecking = signal(false);
	protected readonly isEntitled = this.billingStore.hasAccess;
	protected readonly statusKey = this.billingStore.statusKey;

	public ngOnInit(): void {
		if (isAdminUser(this.authStore.currentUser())) {
			this.router.navigate(['/workspace']);
			return;
		}

		if (this.mode === 'success') {
			this.refreshEntitlement();
		}
	}

	protected goToBilling(): void {
		if (isAdminUser(this.authStore.currentUser())) {
			this.router.navigate(['/workspace']);
			return;
		}

		this.router.navigate(['/billing']);
	}

	protected goToWorkspace(): void {
		this.router.navigate(['/workspace']);
	}

	protected retryCheckout(): void {
		this.router.navigate(['/billing']);
	}

	private refreshEntitlement(): void {
		const user = this.authStore.currentUser();

		if (!user?.id) {
			this.router.navigate(['/sign-in']);
			return;
		}

		if (isAdminUser(user)) {
			this.router.navigate(['/workspace']);
			return;
		}

		this.isChecking.set(true);

		const sessionId = this.route.snapshot.queryParamMap.get('session_id');

		// Stripe's checkout.session.completed webhook is the source of truth, but
		// it can be delayed or undeliverable on local setups. When Stripe handed
		// back a session id, confirm it directly with the backend (which queries
		// Stripe) so the user is activated without depending on the webhook.
		if (sessionId) {
			this.billingStore
				.confirmCheckout(sessionId, user.id)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: (entitlement) => {
						if (entitlement.active || entitlement.status === 'trial') {
							this.isChecking.set(false);
							this.router.navigate(['/workspace']);
							return;
						}
						this.pollEntitlement(user.id);
					},
					error: () => this.pollEntitlement(user.id)
				});
			return;
		}

		this.pollEntitlement(user.id);
	}

	private pollEntitlement(userId: string): void {
		this.isChecking.set(true);

		let attempts = 0;
		let active = false;

		// Fallback when no session id is present: poll in case a webhook arrives.
		timer(0, BillingReturnComponent.POLL_INTERVAL_MS)
			.pipe(
				switchMap(() => this.billingStore.refreshEntitlement(userId)),
				takeWhile((entitlement) => {
					attempts += 1;
					active = entitlement.active || entitlement.status === 'trial';
					return !active && attempts < BillingReturnComponent.MAX_POLL_ATTEMPTS;
				}, true),
				finalize(() => this.isChecking.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: () => {
					if (active) {
						this.router.navigate(['/workspace']);
					}
				}
			});
	}
}
