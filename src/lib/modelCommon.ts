import {env} from '../appEnv'
import {PrimaryGeneratedColumn} from 'typeorm/index'

export const ClubeeoPrimaryColumn = () => {
  return PrimaryGeneratedColumn(env.databasePkStrategy, env.databasePkOptions)
}
