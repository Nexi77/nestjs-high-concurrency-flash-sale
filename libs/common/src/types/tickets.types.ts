export interface InitTicketsRequest {
  id: string;
  count: number;
}

export interface BuyTicketRequest {
  ticketId: string;
  customerEmail: string;
}
