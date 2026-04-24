export interface OrderJobData {
  ticketId: string;
  customerEmail: string;
}

export interface OrderNotificationJobData {
  ticketId: string;
  customerEmail: string;
  orderId: string;
  timestamp: string;
}
