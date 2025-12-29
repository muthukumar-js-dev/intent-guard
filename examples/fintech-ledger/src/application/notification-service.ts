
export interface INotificationService {
    notifyUser(userId: string, message: string): Promise<void>;
}
