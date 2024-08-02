import {
  Column,
} from 'typeorm/index';

import {Index} from 'typeorm'
import ModelBase from './ModelBase';

export interface IClubSocialLinks {
  telegram: string
  discord: string
  instagram: string
  twitter: string
  etherscan: string
  web: string
}

export interface IClubStyle {
  color: string
  textColor: string
  primaryColor: string
  primaryTextColor: string
  font: string
  socialColor: string
  socialTextColor: string
  heroImg: string
  logoImg: string
}

export default abstract class ClubModel<IClubSettings> extends ModelBase {

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String, default: ''})
  @Index({unique: true})
  slug: string;

  @Column({type: String, default: ''})
  description: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  socialLinks: Partial<IClubSocialLinks>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  style: Partial<IClubStyle>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  settings: IClubSettings;

}
