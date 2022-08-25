import ClubApp from '../models/ClubApp'

export interface IClubApp {
  appName: string
  clubApp: ClubApp

  getDataFor(opts: any): Promise<any>
}
