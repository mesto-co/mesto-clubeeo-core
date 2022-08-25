import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
  PrimaryGeneratedColumn, RelationId,
  UpdateDateColumn,
} from 'typeorm/index';

import {TChains, TokenStandardsEnum} from '../lib/TChains'
import TokenContract from './TokenContract'

@Entity()
export default class NftCollection {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, unique: true})
  slug: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  meta: object;

  @ManyToOne(type => TokenContract)
  tokenContract: TokenContract;
  @RelationId((self: NftCollection) => self.tokenContract)
  tokenContractId: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
