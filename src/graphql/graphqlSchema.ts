import {Chains} from '../lib/TChains'

export const graphqlSchema = `
type Query {
  club(slug: String!): Club!
  clubs: [Club]!
  users: [User]!
  userClubRoles: [UserClubRole]!
  wallets: [Wallet]!
}

type Club {
  id: ID!
  name: String!
  slug: String!
  welcome: String!
  description: String!
  buyLinks: Club_BuyLinks!
  socialLinks: ClubSocialLinks!
  style: ClubStyle!
  userClubRoles: [UserClubRole]
  users: [User]
  meInClub: MeInClub!
  createdAt: String!
  updatedAt: String!
}
type Club_BuyLinks {
  opensea: String
  rarible: String
  main: String
  collections: [Club_BuyLinks_Collection]
}
type Club_BuyLinks_Collection {
  name: String
  siteName: String
  url: String
  coverImg: String
}
type ClubSocialLinks {
  tiktok: String
  telegram: String
  discord: String
  instagram: String
  twitter: String
  reddit: String
  facebook: String
  linkedin: String
  etherscan: String
  youtube: String
  web: String
}
type ClubStyle {
  color: String
  textColor: String
  primaryColor: String
  primaryTextColor: String
  font: String
  socialColor: String
  socialTextColor: String
  aside: String
  buttonClass: String
  heroImg: String
  logoImg: String
}

type ClubRole {
  id: ID!
  name: String!
}

type ClubRoleToken {
  id: ID!
  clubRole: ClubRole!
  tokenContract: TokenContract!
}

type MeInClub {
  loggedIn: Boolean!
  isMember: Boolean!
  isAdmin: Boolean!
  isPlatformAdmin: Boolean!
  screenName: String!
  mainWallet: Wallet
}

type TokenContractConfig {
  tokenIdPrefix: String
}
type TokenContract {
  id: ID!
  address: String!
  chain: String!
  standard: String!
  config: TokenContractConfig
}

type UserClubRole {
  id: ID!
  club: Club!
  user: User!
  clubRole: ClubRole
  clubRoleToken: ClubRoleToken
}

type UserList {
  id: ID!
  club: Club!
}

type UserListItem {
  id: ID!
  userList: UserList!
  user: User!
  wallet: Wallet
  createdAt: String!
  updatedAt: String!
}

type User {
  id: ID!
  email: String!
  screenName: String!
  imgUrl: String!
  password: String!
  confirmed: String!
  timezone: String!
  wallets: [Wallet]!
  createdAt: String!
  updatedAt: String!
  rolesInClub(slug: String!): [UserClubRole]!
}

type Wallet {
  id: ID!
  address: String!
  chain: ChainsEnum!
  user: User!
  createdAt: String!
  updatedAt: String!
  chainNorm: String!
}

enum ChainsEnum {
  ${Object.values(Chains).join("\n")}
}


type Mutation {
  createClub(input: CreateClubInput!): Club!
  saveClub(id: ID!, input: SaveClubInput!): Club!
  syncUserClub(clubId: ID!, userId: ID!): Boolean!
  syncUserClubDiscord(clubId: ID!, userId: ID!): Boolean!
}

input CreateClubInput {
  name: String
  slug: String
  description: String
  socialLinks: ClubSocialLinksInput
}
input SaveClubInput {
  name: String
  description: String
  socialLinks: ClubSocialLinksInput
}
input ClubSocialLinksInput {
  tiktok: String
  telegram: String
  discord: String
  instagram: String
  twitter: String
  etherscan: String
  reddit: String
  facebook: String
  linkedin: String
  youtube: String
  web: String
}
`;
