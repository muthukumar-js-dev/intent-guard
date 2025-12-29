
import { IAccountRepository } from '../domain/repositories';
import { Account } from '../domain/account';
import { Money, Currency } from '../shared/money';
import { Result } from '../shared/result';
import { INotificationService } from './notification-service';
import { v4 as uuidv4 } from 'uuid';

export class AccountService {
    constructor(
        private accountRepo: IAccountRepository,
        private notificationService: INotificationService
    ) { }

    public async createAccount(ownerId: string, currency: Currency): Promise<Result<string>> {
        const initialBalanceResult = Money.create(0, currency);
        if (!initialBalanceResult.success) return Result.fail(new Error(initialBalanceResult.error)); // create 0 should succeed

        const account = new Account(uuidv4(), ownerId, initialBalanceResult.value);
        await this.accountRepo.save(account);

        await this.notificationService.notifyUser(ownerId, `Account ${account.id} created.`);

        return Result.ok(account.id);
    }

    public async getAccount(accountId: string): Promise<Result<Account>> {
        const account = await this.accountRepo.findById(accountId);
        if (!account) return Result.fail(new Error(`Account ${accountId} not found`));
        return Result.ok(account);
    }
}
