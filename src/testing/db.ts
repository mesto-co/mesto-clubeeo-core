import {createConnection} from 'typeorm'
import {newDb} from 'pg-mem'

export const newMemoryDB = async () => {
  const db = newDb();

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  const connection = await db.adapters.createTypeormConnection({
    type: 'postgres',
    entities: [
      __dirname + "/../models/*.ts",
    ]
  });

  // create schema
  await connection.synchronize();

  return connection;
}
