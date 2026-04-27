import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BuyTicketDto } from './tickets.dto';

describe('BuyTicketDto', () => {
  it('normalizes customerEmail before validation', async () => {
    const dto = plainToInstance(BuyTicketDto, {
      ticketId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
      customerEmail: '  Customer@Example.com ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.customerEmail).toBe('customer@example.com');
  });
});
