export enum ExtServicesEnum {
  tg = 'tg',
  tgGroup = 'tg:group',
  tgChannel = 'tg:channel',
  typeform = 'typeform',
}

export type TExtServices = ExtServicesEnum | keyof typeof ExtServicesEnum;