import App from '../App';
import {nanoid} from 'nanoid';
import {bool, id, nullable, obj, str} from 'json-schema-blocks';
import {FastifyRequest} from 'fastify'
import Nonce from '../models/Nonce'
import Wallet from '../models/Wallet'
import User from '../models/User'
import {IFastifySession} from '../core/services/AuthService'
import assert = require('assert')
import {EvmChainsEnum, TChains} from '../lib/TChains'
import Club from '../models/Club'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ethWalletEventTypes} from '../clubApps/EthWalletApp/EthWalletAppConfig'
// import assert from 'assert'
// import {nftMoralisNorm} from '../norm/nftNorm'
// import {UserAddressNft} from '../entity/UserAddressNft'

export default function (app: App) {
  return function (router, opts, next) {

    router.post('/nonce', {
      schema: {
        body: obj({
          prefix: str(0, 255),
        }, {optional: ['prefix']}),
        response: {
          200: obj({
            nonce: str(),
          })
        }
      }
    }, async (req, resp) => {
      const prefix = req.body.prefix || '';
      const nonce = prefix + nanoid(64);

      await app.m.save(app.m.create(Nonce, {nonce}));

      resp.send({
        nonce,
      });
    })

    router.post('/verify', {
      schema: {
        body: obj({
          address: str(1),
          nonce: str(16),
          signature: str(16),
        })
      }
    }, async (req: FastifyRequest<{
      Body: { address: string, nonce: string, signature: string }
    }>, resp) => {
      const data = req.body;
      const checksumAddress = app.AppWeb3.ethWeb3.utils.toChecksumAddress(data.address);

      const nonce = await app.m.findOneOrFail(Nonce, {where: {nonce: data.nonce}});

      const verified = await app.AppWeb3.EthSignatureVerificationService.verify(data);

      if (verified) {
        nonce.verified = true;
        nonce.address = checksumAddress;
        nonce.protocol = 'eth';
        await app.m.save(nonce);
      }

      resp.send({
        ...data,
        verified,
      });
    });

    router.post('/verify-and-login', {
      schema: {
        body: obj({
          address: str(1),
          nonce: str(16),
          signature: str(1),
          chain: str(1),
          data: obj({}, {additionalProperties: true})
        })
      }
    }, async (req: FastifyRequest<{
      Body: { address: string, nonce: string, signature: string, chain: TChains, data: Record<string, unknown> },
    }> & { session: IFastifySession }, resp) => {
      const data = req.body;

      const chainContext = app.contexts.chain(req.body.chain);

      const checksumAddress = chainContext.normAddress(data.address);

      const nonce = await app.m.findOneOrFail(Nonce, {where: {nonce: data.nonce}});

      const verified = await chainContext.signatureVerify({
        address: checksumAddress,
        nonce: data.nonce,
        signature: data.signature,
      });

      if (verified) {
        nonce.verified = true;
        nonce.address = checksumAddress;
        nonce.protocol = req.body.chain; //EvmChainsEnum.eth;
        await app.m.save(nonce);

        let user: User;
        let wallet = await app.m.findOne(Wallet, {
          where: {
            address: checksumAddress
          },
          relations: ['user'],
        });

        if (wallet) {
          user = wallet.user;
          assert(user);
        } else {
          user = await app.UserManageService.createUser({});

          wallet = await app.m.save(app.m.create(Wallet, {
            address: checksumAddress,
            user,
            chain: req.body.chain, //EvmChainsEnum.eth;
          }));
        }

        app.auth.logIn(user.id, req.session);

        // handle login with club app
        const appId = req.body.data?.appData?.['appId'] as string;
        if (appId) {
          const clubApp = await app.m.findOne(ClubApp, {
            where: {id: appId},
            relations: ['club'],
          });
          const {value: member} = await app.repos.member.findOrCreate({club: clubApp.club, user});

          await app.engines.motionEngine.processEvent(
            ethWalletEventTypes.login,
            {clubApp, user, member, club: clubApp.club},
            {member}
          )
        }
      }

      resp.send({
        ...data,
        verified,
      });
    });


    // // me in context of community
    // router.get('/me/:slug', {}, async (req, resp) => {
    //   const user = await app.AuthService.getUser(req.session)
    //   if (!user) {
    //     return resp.send({
    //       loggedIn: false,
    //       user: null,
    //       reason: 'no user session'
    //     })
    //   }
    //
    //   const userAddress = await app.m.findOne(UserAddress, {user: {id: user.id}});
    //   if (!userAddress) {
    //     return resp.send({
    //       loggedIn: false,
    //       user: null,
    //       reason: 'no wallet address',
    //     })
    //   }
    //
    //   const slug = req.params.slug;
    //
    //   const tokens = await app.UserTokenService.userOwnedCommunityToken({slug, userAddress: userAddress.address});
    //
    //   if (tokens.length === 0) {
    //     return resp.send({
    //       loggedIn: false,
    //       user: null,
    //       reason: 'no tokens',
    //     })
    //   }
    //
    //   for (let t of tokens) {
    //     const tokenAddress = app.AppWeb3.ethWeb3.utils.toChecksumAddress(t.raw.token_address);
    //     const walletAddress = app.AppWeb3.ethWeb3.utils.toChecksumAddress(userAddress.address);
    //
    //     const userAddressNft = await app.m.findOne(UserAddressNft, {
    //       tokenAddress,
    //       userAddress: walletAddress,
    //       tokenId: t.tokenId,
    //       chain: t.chain,
    //     });
    //
    //     if (!userAddressNft) {
    //       await app.m.save(app.m.create(UserAddressNft, {
    //         tokenAddress,
    //         userAddress: walletAddress,
    //         userUid: user.uid,
    //         tokenId: t.tokenId,
    //         chain: t.chain,
    //       }));
    //     } else {
    //       if (userAddressNft.userUid != user.uid) {
    //         userAddressNft.userUid = user.uid;
    //         await app.m.save(user);
    //       }
    //     }
    //   }
    //
    //   const token = tokens[0];
    //
    //   // update token data in DB
    //   if (token.imageUrl && token.name) {
    //     user.avatar = token.imageUrl;
    //     user.name = token.name;
    //     await app.m.save(user);
    //   }
    //
    //   resp.send({
    //     loggedIn: true,
    //     user: {
    //       id: user.id,
    //       email: user.email,
    //     },
    //     tokens,
    //     token,
    //   })
    // });

    next()
  }
}
