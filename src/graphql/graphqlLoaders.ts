import App from '../App'
import Club from '../models/Club'
import Wallet from '../models/Wallet'
import User from '../models/User'
import {AuthContext} from '../contexts/AuthContext'
import UserClubRole from '../models/UserClubRole'

interface ICtx {
  auth: {
    ctx: AuthContext
  },
}

export const graphqlLoaders = (app: App) => ({
  // Club: {
    // userClubRoles: async (queries, {client}) => {
    //   console.log(queries)
    //   let clubId = queries.map(({obj}) => obj.id);
    //   return await app.m.find(UserClubRole, {
    //     order: {id: 'DESC'},
    //   });
    //
    //   // let genreids = queries.map(({obj}) => obj.genreid)
    //   // let {rows} = await client.query(`
    //   //       SELECT genreid, genredescription genre FROM genres WHERE  genres.genreid = ANY ($1)
    //   //       `, [genreids])
    //   // return genreids.map(genreid => {
    //   //   return rows.filter(genreitem => genreitem.genreid === genreid)[0].genre
    //   // })
    // }
  // }
});
