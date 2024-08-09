import App from '../App';
import Wallet from '../models/Wallet';
import TokenContract from '../models/TokenContract';
import Club from '../models/Club'
import {MockChainsEnum} from '../lib/TChains'
import User from '../models/User'
import {id, str} from 'json-schema-blocks'

export default function (app: App) {
  return function (router, opts, next) {

    router.get('/meinclub/:clubSlug', async (req, resp) => {
      const user = await app.auth.getUser(req);
      const slug = req.params.clubSlug;

      const club = await app.m.findOneByOrFail(Club, {slug});

      const isMember = await app.contexts.userInClub(user, club).isMember();

      resp.send({
        isMember,
      });
    });

    router.get('/isMember', {
      schema: {
        query: {
          userId: str(1),
          clubId: str(1),
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
