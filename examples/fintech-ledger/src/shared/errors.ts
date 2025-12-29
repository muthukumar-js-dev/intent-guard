
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class InsufficientFundsError extends DomainError {
    constructor(accountId: string) {
        super(`Insufficient funds in account ${accountId}`);
        this.name = 'InsufficientFundsError';
    }
}

export class AccountNotFoundError extends DomainError {
    constructor(accountId: string) {
        super(`Account ${accountId} not found`);
        this.name = 'AccountNotFoundError';
    }
}
