import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class InitTicketsDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @Min(1)
  count: number;
}

export class BuyTicketDto {
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
