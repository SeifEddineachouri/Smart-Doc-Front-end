import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
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
		canActivate: [authGuard],
		loadComponent: () => import('./features/chat/chat-workspace/chat-workspace.component').then((m) => m.ChatWorkspaceComponent)
	},
	{
		path: '**',
		redirectTo: 'sign-in'
	}
];
