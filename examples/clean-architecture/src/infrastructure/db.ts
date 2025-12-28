import { UserService } from '../application/user-service';

export class Database {
    constructor(private service: UserService) { }

    save() {
        console.log('Saving to DB');
    }
}
