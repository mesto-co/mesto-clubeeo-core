import "reflect-metadata";
import { DataSource } from "typeorm";
import { MestoApp } from "../App";

const app = new MestoApp();

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
