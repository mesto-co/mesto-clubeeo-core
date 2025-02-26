import {StatusCodes} from 'http-status-codes'
import {AuthContext} from '../contexts/AuthContext'
import { ExtError } from '../core/lib/ExtError'
import { MestoApp } from "@/App";
import Club from "@/models/Club";
import Member from "@/models/Member";
import User from "@/models/User";

export const forbiddenError = () => {
  return new ExtError('Access denied', StatusCodes.FORBIDDEN);
}

export interface ICtx {
  app: MestoApp;
  user: User | null;
  club: Club;
  member: Member | null;
  can: (resource: string, action: string, obj?: any) => Promise<boolean>;
  canOrFail: (resource: string, action: string, obj?: any) => Promise<boolean>;
  auth: {
    ctx: {
      getUser: () => Promise<User | null>;
      getUserOrFail: () => Promise<User>;
      userInClubContext: (club: Club) => Promise<any>;
    };
  };
}
