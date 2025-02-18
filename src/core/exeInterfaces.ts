import { BaseLogger } from "pino";
import { DataSource, EntityManager } from "typeorm";
import ExtendedEntityManager from "./lib/ExtendedEntityManager";
import { IEntityId } from "../lib/common";

export type CBaseLogger = { logger: BaseLogger };

export type CDataSource = { db: DataSource };
export type CEntityManager = { m: EntityManager };
export type CExtendedEntityManager = { em: ExtendedEntityManager };
export type CTypeORM = CDataSource & CEntityManager & CExtendedEntityManager;

export type CAccessEngine = { engines: { access: { isMemberAdmin: (member: IEntityId, club: IEntityId) => Promise<boolean> } }};

export type TExeContainer =
  CBaseLogger &
  CTypeORM &
  CAccessEngine;
