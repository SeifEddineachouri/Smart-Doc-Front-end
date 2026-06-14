import { AuthUserProfile } from '../models';

export function isAdminUser(user: Pick<AuthUserProfile, 'admin' | 'isAdmin'> | null | undefined): boolean {
	return user?.admin === true || user?.isAdmin === true;
}
