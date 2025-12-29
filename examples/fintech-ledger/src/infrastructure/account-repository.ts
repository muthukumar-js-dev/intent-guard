
import { Account } from '../domain/account';
import { IAccountRepository } from '../domain/repositories';

export class InMemoryAccountRepository implements IAccountRepository {
    private accounts: Map<string, Account> = new Map();

    async findById(id: string): Promise<Account | null> {
        const account = this.accounts.get(id);
        return account || null;
    }

    async save(account: Account): Promise<void> {
        this.accounts.set(account.id, account);
    }
}
