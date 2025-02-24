import {StatusCodes} from 'http-status-codes'
import {AuthContext} from '../contexts/AuthContext'
import { ExtError } from '../core/lib/ExtError'

export const forbiddenError = () => {
  return new ExtError('Access denied', StatusCodes.FORBIDDEN);
}

export interface ICtx {
  auth: {
    ctx: AuthContext
  },
}
