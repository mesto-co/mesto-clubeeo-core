import {UserInClubRolesSync} from '../../../src/contexts/UserInClubContext/UserInClubRolesSync'
import App from '../../../src/App'
import {Env} from '../../../src/env'
import {newMemoryDB} from '../../../src/testing/db'
import User from '../../../src/models/User';
import Club from '../../../src/models/Club';
import ClubRoleToken from '../../../src/models/ClubRoleToken'
import UserClubRole from '../../../src/models/UserClubRole'
import {expect} from 'chai';
import {EntityTarget} from 'typeorm/common/EntityTarget'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import {Connection, EntityManager} from 'typeorm/index'
import ClubRole from '../../../src/models/ClubRole'
import TokenContract from '../../../src/models/TokenContract'
import {MockChainsEnum, TokenStandardsEnum} from '../../../src/lib/TChains'
import {
  IWalletAmountAdapter,
  IWalletAmountAdapterFactory,
} from '../../../src/services/walletAmount/walletAmountInterfaces'
import {ITokenContract, IUserWallet} from '../../../src/logic/TokenOwnershipLogic'
import Wallet from '../../../src/models/Wallet'

const createAndSave = async <Entity>(m: EntityManager, entityClass: EntityTarget<Entity>, plainObject?: DeepPartial<Entity>): Promise<Entity> => {
  return await m.save(
    m.create(
      entityClass, plainObject,
    )
  );
};

describe('UserInClubRolesSync', function () {
  const env = Env.getInstance();
  let db: Connection;
  let mapp: App;
  let user: User;
  let wallet: Wallet;
  let club: Club;
  let clubRole: ClubRole;
  let tokenContract: TokenContract;
  let subj: UserInClubRolesSync;

  before(async () => {
    db = await newMemoryDB();

    mapp = new App(db, env);

    // create DB for tests - with User, Wallet, Club, Club Role, Token Contract
    user = await createAndSave(mapp.m, User, {screenName: 'tester'});
    wallet = await createAndSave(mapp.m, Wallet, {address: '0xTEST_WALLET_1', chain: MockChainsEnum.mock_chain, user});
    club = await createAndSave(mapp.m, Club, {name: 'test club', slug: 'test-club'});
    clubRole = await createAndSave(mapp.m, ClubRole, {club, name: 'club-member'});
    tokenContract = await createAndSave(mapp.m, TokenContract, {
      address: '0xTEST_CONTRACT_1', chain: MockChainsEnum.mock_chain, standard: TokenStandardsEnum.ERC721
    });
    await createAndSave(mapp.m, ClubRoleToken, {clubRole, tokenContract});

    // create additional entities
    const clubRole2 = await createAndSave(mapp.m, ClubRole, {club, name: 'club-premium'});
    const tokenContract2 = await createAndSave(mapp.m, TokenContract, {
      address: '0xTEST_CONTRACT_2', chain: MockChainsEnum.mock_chain, standard: TokenStandardsEnum.ERC721
    });
    await createAndSave(mapp.m, ClubRoleToken, {clubRole: clubRole2, tokenContract: tokenContract2});
    const tokenContract3 = await createAndSave(mapp.m, TokenContract, {
      address: '0xTEST_CONTRACT_3', chain: MockChainsEnum.mock_chain, standard: TokenStandardsEnum.ERC721
    });
    await createAndSave(mapp.m, ClubRoleToken, {clubRole: clubRole2, tokenContract: tokenContract3});

    const user2 = await createAndSave(mapp.m, User, {screenName: 'tester2'});
    const wallet2 = await createAndSave(mapp.m, Wallet, {address: '0xTEST_WALLET_2', chain: MockChainsEnum.mock_chain, user: {id: user2.id}});
    const club2 = await createAndSave(mapp.m, Club, {name: 'test club 2', slug: 'test-club-2'});

    const clubRole_club2 = await createAndSave(mapp.m, ClubRole, {club: club2, name: 'club-premium'});
    const tokenContract_club2 = await createAndSave(mapp.m, TokenContract, {
      address: '0xTEST_CONTRACT_CLUB_2', chain: MockChainsEnum.mock_chain, standard: TokenStandardsEnum.ERC721
    });
    await createAndSave(mapp.m, ClubRoleToken, {clubRole: clubRole_club2, tokenContract: tokenContract_club2});

    subj = new UserInClubRolesSync(mapp, user, club);
  });

  beforeEach(async () => {
    await mapp.m.delete(UserClubRole, {});
  });

  it("user don't have tokens - create disabled roles", async () => {
    // create additional user without any tokens
    const userWithoutTokens = await createAndSave(mapp.m, User, {screenName: 'userWithoutTokens'});

    const subj = new UserInClubRolesSync(mapp, userWithoutTokens, club);
    const result = await subj.roleSync();

    // no roles
    expect(result).equal(false);

    // no new roles
    expect(await mapp.m.findBy(UserClubRole, {
      user: {id: userWithoutTokens.id},
      enabled: true,
    })).deep.equal([]);

    const disabledRoles = await mapp.m.find(UserClubRole, {
      where: {
        user: {id: userWithoutTokens.id},
        enabled: false,
      },
      relations: {
        clubRole: true,
        clubRoleToken: {
          clubRole: true
        }
      }
    });

    expect(disabledRoles.length).equal(3, 'should create three UserClubRole records on mock data: for "club-member" and 2x for "club-premium" roles');

    expect(await mapp.m.findOneBy(UserClubRole, {
      user: {id: userWithoutTokens.id},
      clubRoleToken: {clubRole: {name: 'club-member'}}
    })).property('enabled', false, 'should create disabled UserClubRole for "club-member"');

    expect(await mapp.m.findOneBy(UserClubRole, {
      user: {id: userWithoutTokens.id},
      clubRoleToken: {clubRole: {name: 'club-premium'}}
    })).property('enabled', false, 'should create disabled UserClubRole for "club-premium"');
  });

  it("user have membership tokens - create enabled roles", async () => {
    class MockApp extends App {
      get walletAmountFactory(): IWalletAmountAdapterFactory {
        console.log('walletAmountFactory');
        return {
          buildFor(params: { wallet: IUserWallet, contract: ITokenContract }): IWalletAmountAdapter {
            return {
              getWalletTokenAmount: async (userWallet: IUserWallet, tokenContract: ITokenContract): Promise<number> => {
                if (tokenContract.address === '0xTEST_CONTRACT_1' && userWallet.address === '0xTEST_WALLET_1') return 1;
                return 0;
              }
            }
          }
        }
      }
    }
    mapp = new MockApp(db, env);

    const subj = new UserInClubRolesSync(mapp, user, club);
    const result = await subj.roleSync();

    // has roles
    expect(result).equal(true);

    const disabledRoles = await mapp.m.find(UserClubRole, {
      where: {
        user: {id: user.id},
        enabled: false,
      },
      relations: {
        clubRole: true,
        clubRoleToken: {
          clubRole: true
        }
      }
    });

    expect(disabledRoles.length).equal(2, 'should create two disabled UserClubRole records on mock data: 2x for "club-premium" roles');

    expect(await mapp.m.findOneBy(UserClubRole, {
      user: {id: user.id},
      clubRoleToken: {clubRole: {name: 'club-member'}}
    })).property('enabled', true, 'should create enabled UserClubRole for "club-member"');

    expect(await mapp.m.findOneBy(UserClubRole, {
      user: {id: user.id},
      clubRoleToken: {clubRole: {name: 'club-premium'}}
    })).property('enabled', false, 'should create disabled UserClubRole for "club-premium"');

  });

});
