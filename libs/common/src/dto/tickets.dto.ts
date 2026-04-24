import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

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

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;
}
