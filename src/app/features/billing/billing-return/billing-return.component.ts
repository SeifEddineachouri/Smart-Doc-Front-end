import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
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
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly authStore = inject(AuthStore);
	private readonly billingStore = inject(BillingStore);

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

		this.billingStore
			.refreshEntitlement(user.id)
			.pipe(finalize(() => this.isChecking.set(false)))
			.subscribe({
				next: (entitlement) => {
					if (entitlement.active || entitlement.status === 'trial') {
						this.router.navigate(['/workspace']);
					}
				},
				error: () => {
					this.isChecking.set(false);
				}
			});
	}
}
