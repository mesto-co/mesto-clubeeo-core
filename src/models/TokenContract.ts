import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';

import {TChains, TokenStandardsEnum} from '../lib/TChains'
import {ITokenContractConfig} from '../logic/TokenOwnershipLogic'

@Entity()
export default class TokenContract {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, default: ''})
  address: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @Column({type: String, default: ''})
  standard: TokenStandardsEnum;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  config: ITokenContractConfig;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
