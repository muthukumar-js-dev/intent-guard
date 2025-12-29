
import { Money } from '../shared/money';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export class Transaction {
    constructor(
        public readonly id: string,
        public readonly accountId: string,
        public readonly amount: Money,
        public readonly type: TransactionType,
        public readonly timestamp: Date,
        public readonly relatedTransactionId?: string // For transfers
    ) { }

    // Factory method to ensure valid creation if needed
    public static create(
        id: string,
        accountId: string,
        amount: Money,
        type: TransactionType,
        relatedTransactionId?: string
    ): Transaction {
        return new Transaction(id, accountId, amount, type, new Date(), relatedTransactionId);
    }
}
