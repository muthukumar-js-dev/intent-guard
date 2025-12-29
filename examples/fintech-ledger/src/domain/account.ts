
import { Money } from '../shared/money';
import { Result } from '../shared/result';
import { InsufficientFundsError } from '../shared/errors';
import { Transaction, TransactionType } from './transaction';
import { v4 as uuidv4 } from 'uuid';

export type AccountStatus = 'ACTIVE' | 'FROZEN';

export class Account {
    private _balance: Money;
    private _transactions: Transaction[] = [];

    constructor(
        public readonly id: string,
        public readonly ownerId: string,
        initialBalance: Money,
        public status: AccountStatus = 'ACTIVE'
    ) {
        this._balance = initialBalance;
    }

    get balance(): Money {
        return this._balance;
    }

    public deposit(amount: Money): Result<Transaction, string> {
        if (this.status === 'FROZEN') {
            return Result.fail('Account is frozen');
        }

        const newBalanceResult = this._balance.add(amount);
        if (!newBalanceResult.success) return Result.fail(newBalanceResult.error);

        this._balance = newBalanceResult.value;

        const transaction = Transaction.create(
            uuidv4(),
            this.id,
            amount,
            'DEPOSIT'
        );
        this._transactions.push(transaction);

        return Result.ok(transaction);
    }

    public withdraw(amount: Money): Result<Transaction, Error> {
        if (this.status === 'FROZEN') {
            return Result.fail(new Error('Account is frozen'));
        }

        const newBalanceResult = this._balance.subtract(amount);
        if (!newBalanceResult.success) {
            // Here we map the string error from Money to a Domain Error if needed, 
            // or just return generic error. For simplicity, we check sign.
            return Result.fail(new Error(newBalanceResult.error));
        }

        // Check for negative balance (assuming no overdraft)
        if (newBalanceResult.value.amount < 0) {
            return Result.fail(new InsufficientFundsError(this.id));
        }

        this._balance = newBalanceResult.value;

        const transaction = Transaction.create(
            uuidv4(),
            this.id,
            amount,
            'WITHDRAWAL'
        );
        this._transactions.push(transaction);

        return Result.ok(transaction);
    }

    public freeze(): void {
        this.status = 'FROZEN';
    }

    public unfreeze(): void {
        this.status = 'ACTIVE';
    }
}
