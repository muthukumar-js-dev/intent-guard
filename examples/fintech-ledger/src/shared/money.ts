
import { Result } from './result';

export type Currency = 'USD' | 'EUR' | 'GBP';

export class Money {
    private constructor(
        public readonly amount: number,
        public readonly currency: Currency
    ) { }

    public static create(amount: number, currency: Currency): Result<Money, string> {
        if (amount < 0) {
            return Result.fail('Amount cannot be negative');
        }
        // Simple validation for safe integers
        if (!Number.isSafeInteger(amount)) {
            // In real app, we'd use a BigInt or Decimal library
            // For this demo, we assume inputs are cents/lowest unit
        }
        return Result.ok(new Money(amount, currency));
    }

    public add(other: Money): Result<Money, string> {
        if (other.currency !== this.currency) {
            return Result.fail(`Currency mismatch: cannot add ${other.currency} to ${this.currency}`);
        }
        return Money.create(this.amount + other.amount, this.currency);
    }

    public subtract(other: Money): Result<Money, string> {
        if (other.currency !== this.currency) {
            return Result.fail(`Currency mismatch: cannot subtract ${other.currency} from ${this.currency}`);
        }
        return Money.create(this.amount - other.amount, this.currency);
    }

    public toString(): string {
        return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
    }
}
