import {Chains} from '../lib/TChains'
import {badgeMutationsSchema, badgesMutationsTypes, clubBadgeType} from './badgesGraphql'
import {clubRoleType, rolesMutationsSchema, rolesMutationsTypes} from './rolesGraphql'

export const graphqlSchema = `
type Query {
  club(slug: String!): Club!
  clubApp(appSlug: String!): ClubApp!
  clubs: [Club]!
  me: Me!
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
  settings: Club_Settings!
  userClubRoles: [UserClubRole]
  users(searchWallet: String, searchName: String, page: Int, take: Int): UserIndex
  roles: [ClubRole]
  badges: [ClubBadge]
  meInClub: MeInClub!
  roadmap: ClubRoadmap!
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
type ClubRoadmap {
  entries: [RoadmapEntry]
}
type RoadmapEntry {
  title: String!
  text: String!
  when: String!
}
type Club_Settings {
  isPremium: Boolean
}

type ClubApp {
  id: ID!
  club: Club!
  title: String!
  appName: String!
  appSlug: String!
  menuIndex: String!
  config: String!
}

${clubRoleType}

type ClubRoleToken {
  id: ID!
  clubRole: ClubRole!
  tokenContract: TokenContract!
}

${clubBadgeType}

type Me {
  loggedIn: Boolean!
}

type Member {
  id: ID!
}

type MeInClub {
  loggedIn: Boolean!
  isMember: Boolean!
  isAdmin: Boolean!
  isPlatformAdmin: Boolean!
  isPremium: Boolean
  screenName: String!
  mainWallet: Wallet
  menu: MyClubMenu
}
type MyClubMenu {
  items: [MyClubMenuItem]!
}
type MyClubMenuItem {
  appSlug: String!
  appName: String!
  title: String!
  icon: String
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
  userExts: [UserExt]!
  createdAt: String!
  updatedAt: String!
  rolesInClub(slug: String!): [UserClubRole]!
  memberInClub(slug: String!): Member
}

type UserIndex {
  items: [User]!
  count: Int!
}

type UserExt {
  id: ID!
  user: User!
  service: String!
  extId: String!
  getAccount: UserExt_GetAccount
}
type UserExt_GetAccount {
  link: String!
  name: String!
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
  
  ${badgeMutationsSchema}
  ${rolesMutationsSchema}
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
  roadmap: ClubRoadmapInput
  heroImg: String
  logoImg: String
}
input ClubSocialLinksInput {
  tiktok: String
  telegram: String
  instagram: String
  twitter: String
  etherscan: String
  reddit: String
  facebook: String
  linkedin: String
  youtube: String
  web: String
}
input ClubRoadmapInput {
  entries: [ClubRoadmapInput_Entry]
}
input ClubRoadmapInput_Entry {
  title: String!
  text: String!
  when: String!
}
${rolesMutationsTypes}
${badgesMutationsTypes}
`;

// type Query {
//     post(id: ID!): Post!
//     posts: [Post]!
// }
// type Mutation {
//     createPost(data: CreatePostInput!): Post!
// }
// type Post {
//     id: ID!
//     title: String!
//     body: String!
//     category: String!
//     published: Boolean!
// }
// input CreatePostInput {
//     id: ID
//     title: String!
//     body: String!
//     category: String!
//     published: Boolean!
// }
