import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('events')
export class EventEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  venue: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column('text')
  teaser: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  highlights: string[];

  @Column('int')
  initialInventory: number;
}
