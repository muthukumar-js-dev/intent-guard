import { ConfigLoader } from './config';
import { IntentGuardConfig } from './types';

export function validateUserPermissions(user: any, resource: string): boolean {
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }
    return true;
}

export default class UserService {
    async getUser(id: string) {
        return { id, name: 'Test User' };
    }

    private validateAccess(userId: string): void {
        // Validation logic
    }
}

export const API_VERSION = '1.0.0';
