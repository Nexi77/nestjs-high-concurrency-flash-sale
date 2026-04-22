import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  userId: string;

  @Column({ default: 'confirmed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
