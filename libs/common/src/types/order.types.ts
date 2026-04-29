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

export type OrderStatus = 'pending' | 'completed';

export interface BuyTicketResponse {
  orderId: string;
  status: 'pending';
  message: string;
}

export interface GetOrderStatusResponse {
  orderId: string;
  status: OrderStatus;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: OrderStatus;
}
