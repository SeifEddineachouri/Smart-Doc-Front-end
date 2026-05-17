import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { billingAccessGuard, billingCheckoutGuard } from './core/guards/billing.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'sign-in'
	},
	{
		path: 'sign-in',
		canActivate: [guestGuard],
		loadComponent: () => import('./features/auth/sign-in/sign-in.component').then((m) => m.SignInComponent)
	},
	{
		path: 'sign-up',
		canActivate: [guestGuard],
		loadComponent: () => import('./features/auth/sign-up/sign-up.component').then((m) => m.SignUpComponent)
	},
	{
		path: 'workspace',
		canActivate: [authGuard, billingAccessGuard],
		loadComponent: () => import('./features/chat/chat-workspace/chat-workspace.component').then((m) => m.ChatWorkspaceComponent)
	},
	{
		path: 'paywall',
		canActivate: [authGuard, billingCheckoutGuard],
		loadComponent: () => import('./features/billing/billing-checkout/billing-checkout.component').then((m) => m.BillingCheckoutComponent)
	},
	{
		path: 'billing/success',
		canActivate: [authGuard],
		data: { mode: 'success' },
		loadComponent: () => import('./features/billing/billing-return/billing-return.component').then((m) => m.BillingReturnComponent)
	},
	{
		path: 'billing/cancel',
		canActivate: [authGuard],
		data: { mode: 'cancel' },
		loadComponent: () => import('./features/billing/billing-return/billing-return.component').then((m) => m.BillingReturnComponent)
	},
	{
		path: 'billing',
		canActivate: [authGuard],
		loadComponent: () => import('./features/billing/billing-checkout/billing-checkout.component').then((m) => m.BillingCheckoutComponent)
	},
	{
		path: '**',
		redirectTo: 'sign-in'
	}
];
