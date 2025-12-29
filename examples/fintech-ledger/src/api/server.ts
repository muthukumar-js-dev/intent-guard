
import express from 'express';
import { AccountService } from '../application/account-service';
import { TransferService } from '../application/transfer-service';
import { InMemoryAccountRepository } from '../infrastructure/account-repository';
import { InMemoryTransactionRepository } from '../infrastructure/transaction-repository';
import { ConsoleNotificationService } from '../infrastructure/notification-service';
import { Money } from '../shared/money';

const app = express();
app.use(express.json());

// Composition Root (Wiring Dependencies)
const accountRepo = new InMemoryAccountRepository();
const transactionRepo = new InMemoryTransactionRepository();
const notificationService = new ConsoleNotificationService();

const accountService = new AccountService(accountRepo, notificationService);
const transferService = new TransferService(accountRepo, transactionRepo, notificationService);

// Routes
app.post('/accounts', async (req, res) => {
    const { ownerId, currency } = req.body;
    const result = await accountService.createAccount(ownerId, currency);

    if (result.success) {
        res.status(201).json({ accountId: result.value });
    } else {
        res.status(400).json({ error: result.error });
    }
});

app.get('/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const result = await accountService.getAccount(id);

    if (result.success) {
        res.json({
            id: result.value.id,
            balance: result.value.balance.amount,
            currency: result.value.balance.currency,
            status: result.value.status
        });
    } else {
        res.status(404).json({ error: result.error.message });
    }
});

app.post('/transfer', async (req, res) => {
    const { fromAccountId, toAccountId, amount, currency } = req.body;

    const moneyResult = Money.create(amount, currency);
    if (!moneyResult.success) {
        return res.status(400).json({ error: moneyResult.error });
    }

    const result = await transferService.transfer(fromAccountId, toAccountId, moneyResult.value);

    if (result.success) {
        res.status(200).json({ message: 'Transfer successful' });
    } else {
        res.status(400).json({ error: result.error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`FinTech Ledger running on port ${PORT}`);
});
// Triggering diff validation
