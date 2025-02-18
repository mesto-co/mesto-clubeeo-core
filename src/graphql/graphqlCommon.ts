import mercurius from 'mercurius'
import {StatusCodes} from 'http-status-codes'
import {AuthContext} from '../contexts/AuthContext'

export const forbiddenError = () => {
  return new mercurius.ErrorWithProps('Access denied', {}, StatusCodes.FORBIDDEN);
}

export interface ICtx {
  auth: {
    ctx: AuthContext
  },
}
