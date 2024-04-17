import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
   RelationId,
  UpdateDateColumn,
} from 'typeorm/index';
import TokenContract from './TokenContract'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class NftCollection {

  @ClubeeoPrimaryColumn()
  id: string;

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
  tokenContractId: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
