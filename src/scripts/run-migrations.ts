import "reflect-metadata";
import { DataSource } from "typeorm";
import MestoEnv from "../Env";
import { MestoApp } from "../App";

const env = new MestoEnv();
const app = new MestoApp(env);

export const AppDataSource = new DataSource({
    ...app.dataSourceSettings,
    synchronize: true,
});

async function runMigrations() {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await AppDataSource.destroy();
}

runMigrations().catch((error) => console.error("Migration error:", error));
