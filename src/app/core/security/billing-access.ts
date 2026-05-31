import { AuthUserProfile } from '../models';

const ADMIN_EMAIL_ALLOWLIST = new Set(
	[
		'seifachouri550@gmail.com'
	]
		.map((email) => email.trim().toLowerCase())
);

export function isAdminUser(user: Pick<AuthUserProfile, 'email'> | null | undefined): boolean {
	if (!user?.email) {
		return false;
	}

	return ADMIN_EMAIL_ALLOWLIST.has(user.email.trim().toLowerCase());
}
