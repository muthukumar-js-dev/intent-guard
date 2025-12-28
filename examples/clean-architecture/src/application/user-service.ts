import { User } from '../domain/user';

export class UserService {
    createUser(id: string): User {
        return { id };
    }
}
