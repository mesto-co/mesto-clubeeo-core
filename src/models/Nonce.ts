import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export default class Nonce {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  @Index({unique: true})
  nonce: string;

  @Column({type: Boolean, default: false})
  verified: boolean;

  @Column({type: String, default: ''})
  @Index()
  address: string;

  @Column({type: String, default: ''})
  protocol: string;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
