import App from '../App'
import {TExtServices} from '../lib/enums'
import {ISomeUserData} from '../models/repos/UserRepo'
import UserExt from '../models/UserExt'
import User from '../models/User'
import { ExtServicesEnum } from '../core/lib/enums';

/** 
 * @deprecated - soon to be moved proper engine
 */ 
export const fetchUserAndExtByExtId = async (app: App, opts: {extId: string, service: TExtServices, userData?: ISomeUserData, sourceData?: any}) => {
  const {extId, service, userData} = opts;

  const {value: userExt, isCreated} = await app.em.createOrLazyUpdateBy(UserExt, {
    service,
    extId: String(extId),
  }, {
    username: userData.username,
    lang: userData.language_code,
  }, {
    data: opts.sourceData || opts.userData,
  });

  let user: User;
  if (isCreated || !userExt.userId) {
    user = await app.repos.user.create({
      lang: userData.language_code,
      screenName: app.repos.user.genScreenName(userData),
    });

    userExt.user = user;
    await app.m.save(userExt);
  } else {
    user = await app.repos.user.findUserByExt(userExt);
  }

  return {
    isCreated,
    userExt,
    user,
  }
}

export {ExtServicesEnum};