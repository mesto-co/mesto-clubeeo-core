// import { PrimaryGeneratedColumnNumericOptions } from 'typeorm/decorator/options/PrimaryGeneratedColumnNumericOptions';
import {PrimaryGeneratedColumn} from 'typeorm/index'
// import { Env } from '@/core/lib/EnvDecorator';

// class TypeORMEnv {
//   @Env('increment')
//   readonly databasePkStrategy: 'increment';

//   @Env({default: '{"type":"bigint"}', type: 'json'})
//   readonly databasePkOptions: PrimaryGeneratedColumnNumericOptions
// }

// const env = new TypeORMEnv();

export const ClubeeoPrimaryColumn = () => {
  // return PrimaryGeneratedColumn(env.databasePkStrategy, env.databasePkOptions)
  return PrimaryGeneratedColumn('increment', {type: 'bigint'})
}
