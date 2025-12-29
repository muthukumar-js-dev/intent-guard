
import { Transaction } from '../domain/transaction';
import { ITransactionRepository } from '../domain/repositories';

export class InMemoryTransactionRepository implements ITransactionRepository {
    private transactions: Transaction[] = [];

    async save(transaction: Transaction): Promise<void> {
        this.transactions.push(transaction);
    }

    async findByAccountId(accountId: string): Promise<Transaction[]> {
        return this.transactions.filter(t => t.accountId === accountId);
    }
}
