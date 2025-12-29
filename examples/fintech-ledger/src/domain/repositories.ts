
import { Account } from './account';
import { Transaction } from './transaction';

export interface IAccountRepository {
    findById(id: string): Promise<Account | null>;
    save(account: Account): Promise<void>;
}

export interface ITransactionRepository {
    save(transaction: Transaction): Promise<void>;
    findByAccountId(accountId: string): Promise<Transaction[]>;
}
