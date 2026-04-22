export interface OrderJobData {
  ticketId: string;
  userId: string;
}

export interface OrderNotificationJobData {
  ticketId: string;
  userId: string;
  orderId: string;
  timestamp: string;
}
