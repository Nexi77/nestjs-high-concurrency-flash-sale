export interface OrderJobData {
  orderId: string;
  ticketId: string;
  customerEmail: string;
}

export interface OrderNotificationJobData {
  ticketId: string;
  customerEmail: string;
  orderId: string;
  timestamp: string;
}

export interface BuyTicketResponse {
  orderId: string;
  status: 'pending';
  message: string;
}
