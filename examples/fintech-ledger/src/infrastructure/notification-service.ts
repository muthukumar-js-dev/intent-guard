
import { INotificationService } from '../application/notification-service';

export class ConsoleNotificationService implements INotificationService {
    async notifyUser(userId: string, message: string): Promise<void> {
        console.log(`[Notification] To User ${userId}: ${message}`);
    }
}
