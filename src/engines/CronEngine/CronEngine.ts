import App from "@/BaseApp";
import * as cron from "node-cron";

export class CronEngine {
  constructor(private readonly app: App) {
  }

  HOURLY = '0 * * * *'
  DAILY = '0 0 * * *'
  WEEKLY = '0 0 * * 0'
  MONTHLY = '0 0 1 * *'
  YEARLY = '0 0 1 1 *'

  schedule(cronExpression: string, callback: () => void) {
    cron.schedule(cronExpression, callback);
  }
}