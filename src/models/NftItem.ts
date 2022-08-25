import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
  PrimaryGeneratedColumn, RelationId, Unique,
  UpdateDateColumn,
} from 'typeorm/index';

import {TChains, TokenStandardsEnum} from '../lib/TChains'
import TokenContract from './TokenContract'
import NftCollection from './NftCollection'

@Entity()
@Unique(['collection', 'eid'])
export default class NftItem {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, default: ''})
  eid: string;

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String, default: ''})
  description: string;

  @Column({type: String, default: ''})
  image: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  meta: object;

  @ManyToOne(type => NftCollection)
  collection: NftCollection;
  @RelationId((self: NftItem) => self.collection)
  collectionId: number;

  @Column({type: Boolean, default: false})
  default: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
