import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('orders')
@Index(['ticketId', 'customerEmail'], { unique: true })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  customerEmail: string;

  @Column({ default: 'confirmed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
