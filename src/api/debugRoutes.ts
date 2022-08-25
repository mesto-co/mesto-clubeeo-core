import App from '../App';
import {MoralisChains} from '../services/external/MoralisApi';
import Wallet from '../models/Wallet';
import TokenContract from '../models/TokenContract';
import Club from '../models/Club'
import {MockChainsEnum} from '../lib/TChains'
import User from '../models/User'
import {id} from 'json-schema-blocks'

export default function (app: App) {
  return function (router, opts, next) {

    router.get('/address/:wallet', async (req, resp) => {
      const walletAddress = req.params.wallet;

      const result = await app.MoralisApi.getAddressNft(walletAddress, MoralisChains.eth);

      resp.send(result);
    });

    router.get('/addressToken/:wallet/:token', async (req, resp) => {
      const walletAddress = req.params.wallet;
      const tokenAddress = req.params.token;

      const result = await app.MoralisApi.getAddressNftToken(walletAddress, MoralisChains.eth, tokenAddress);

      resp.send(result);
    });

    // router.get('/iown/:tokenId', async (req, resp) => {
    //   const tokenId = req.params.tokenId;
    //
    //   const doIOwn = await doIOwnTokenLogic({
    //     app,
    //     tokenContractGetter: () => app.m.findOneByOrFail(TokenContract, {id: tokenId}),
    //     userWalletsGetter: async (chain: TChains) => {
    //       const user = await app.auth.getUser(req);
    //       return await app.m.find(Wallet, {
    //         where: {
    //           user: {id: user.id},
    //           chain: baseChain(chain),
    //         }
    //       });
    //     },
    //     walletOwnsTokenCheck: (userWallet, tokenContract) => {
    //       return app.WalletService.syncWalletOwnsToken(userWallet, tokenContract);
    //     },
    //   });
    //
    //   resp.send({
    //     doIOwn,
    //   });
    // });

    router.get('/meinclub/:clubSlug', async (req, resp) => {
      const user = await app.auth.getUser(req);
      const slug = req.params.clubSlug;

      const club = await app.m.findOneByOrFail(Club, {slug});

      const isMember = await app.contexts.userInClub(user, club).isMember();

      resp.send({
        isMember,
      });
    });

    // router.get('/userOwn/:userId/:tokenId', async (req, resp) => {
    //   const userId = req.params.userId;
    //   const tokenId = req.params.tokenId;
    //
    //   const doIOwn = await doIOwnTokenLogic({
    //     app,
    //     tokenContractGetter: () => app.m.findOneByOrFail(TokenContract, {id: tokenId}),
    //     userWalletsGetter: async (chain: TChains) => {
    //       const user = await app.m.findOneBy(User, {id: userId});
    //
    //       return await app.m.find(Wallet, {
    //         where: {
    //           user: {id: user.id},
    //           chain: baseChain(chain),
    //         }
    //       });
    //     },
    //     walletOwnsTokenCheck: (userWallet, tokenContract) => {
    //       return app.WalletService.syncWalletOwnsToken(userWallet, tokenContract);
    //     },
    //   });
    //
    //   resp.send({
    //     doIOwn,
    //   });
    // });

    router.get('/isMember', {
      schema: {
        query: {
          userId: id(),
          clubId: id(),
        }
      }
    },
      async (req, resp) => {
      const user = await app.m.findOneByOrFail(User, {id: req.query.userId});
      const club = await app.m.findOneByOrFail(Club, {id: req.query.clubId});

      const isMember = await app.contexts.userInClub(user, club).isMember();
      const isMemberCached = await app.contexts.userInClub(user, club).isMember({
        useCache: true
      });

      resp.send({
        isMember,
        isMemberCached,
      });
    });

    /**
     * Add mock token by userId & contractId
     */
    router.get('/wallet/:walletAddress/token/:tokenId/add', async (req, resp) => {
      const walletAddress = req.params.walletAddress;
      const chain = MockChainsEnum.mock_chain;
      const wallet = await app.m.findOneByOrFail(Wallet, {
        address: walletAddress,
        chain,
      });

      const tokenId = req.params.tokenId;
      const tokenContract = await app.m.findOneByOrFail(TokenContract, {
        id: tokenId,
        chain,
      });

      const walletNft = await app.repos.walletNft.createOrUpdate({
        walletAddress: wallet.address,
        chain,
        contractAddress: tokenContract.address,
        ownedAmount: 1,
      });

      resp.send({
        ok: true,
        walletNft,
      });
    });

    /**
     * Removes mock token by userId & contractId
     */
    router.get('/wallet/:walletAddress/token/:tokenId/remove', async (req, resp) => {
      const walletAddress = req.params.walletAddress;
      const chain = MockChainsEnum.mock_chain;
      const wallet = await app.m.findOneByOrFail(Wallet, {
        address: walletAddress,
        chain,
      });

      const tokenId = req.params.tokenId;
      const tokenContract = await app.m.findOneByOrFail(TokenContract, {
        id: tokenId,
        chain,
      });

      const walletNft = await app.repos.walletNft.createOrUpdate({
        walletAddress: wallet.address,
        chain,
        contractAddress: tokenContract.address,
        ownedAmount: 0,
      });

      resp.send({
        ok: true,
        walletNft,
      });
    });

    router.get('/club/:clubSlug/snapshot', async (req, resp) => {
      const clubSlug = String(req.params.clubSlug);

      const clubContext = await app.contexts.clubBySlug(clubSlug);

      const snapshot = await clubContext.snapshot();

      resp.send({
        snapshot,
      });
    });

    next();
  }

}
