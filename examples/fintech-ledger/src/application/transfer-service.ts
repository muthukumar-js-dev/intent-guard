
import { IAccountRepository, ITransactionRepository } from '../domain/repositories';
import { Money } from '../shared/money';
import { Result } from '../shared/result';
import { INotificationService } from './notification-service';

export class TransferService {
    constructor(
        private accountRepo: IAccountRepository,
        private transactionRepo: ITransactionRepository,
        private notificationService: INotificationService
    ) { }

    public async transfer(
        fromAccountId: string,
        toAccountId: string,
        amount: Money
    ): Promise<Result<void>> {
        const fromAccount = await this.accountRepo.findById(fromAccountId);
        const toAccount = await this.accountRepo.findById(toAccountId);

        if (!fromAccount) return Result.fail(new Error('Sender account not found'));
        if (!toAccount) return Result.fail(new Error('Receiver account not found'));

        // Domain Logic: Withdraw from sender
        const withdrawResult = fromAccount.withdraw(amount);
        if (!withdrawResult.success) {
            return Result.fail(withdrawResult.error);
        }

        // Domain Logic: Deposit to receiver
        // NOTE: Simulating currency conversion not implemented for brevity
        const depositResult = toAccount.deposit(amount);
        if (!depositResult.success) {
            // Rollback would be needed in real DB transaction here
            // For in-memory or simplistic demo, we might fail hard or compensate.
            // We act like deposit failed, but withdrawal succeeded on object level.
            // In real world, we would reload originals or throw to rollback DB txn.
            return Result.fail(new Error(`Deposit failed: ${depositResult.error}`));
        }

        // Persist changes
        await this.accountRepo.save(fromAccount);
        await this.accountRepo.save(toAccount);

        // Persist transactions
        await this.transactionRepo.save(withdrawResult.value);
        await this.transactionRepo.save(depositResult.value);

        // Notify
        await this.notificationService.notifyUser(fromAccount.ownerId, `Transfer sent: ${amount.toString()}`);
        await this.notificationService.notifyUser(toAccount.ownerId, `Transfer received: ${amount.toString()}`);

        return Result.ok(undefined);
    }
}
