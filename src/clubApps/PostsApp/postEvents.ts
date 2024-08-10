import mitt, {Emitter} from 'mitt';
import App from '../../App'
import Club from '../../models/Club'
import Post from '../../models/Post'
import PostReaction from '../../models/PostReaction'
import User from '../../models/User'
import PostingApp from '../PostingApp/PostingApp'
import {eventNames} from '../../engines/MotionEngine/shared/eventNames'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

export type TPostEvents = {
  reaction: {
    club: Club,
    clubApp: ClubApp,
    post: Post,
    reaction: PostReaction,
    user: User,
  }
  // tokenAmountChanged: {},
  // tokenIsAcquired: {
  //   walletNft: WalletNft,
  // },
  // tokenIsSold: {
  //   // tokenContract: string,
  //   walletNft: WalletNft,
  //   previousAmount: number,
  // },
  // tokenAmountIncreased: {
  //   walletNft: WalletNft,
  //   previousAmount: number,
  // },
  // tokenAmountDecreased: {
  //   walletNft: WalletNft,
  //   previousAmount: number,
  // }
};

export function postEventsFactory(app: App): Emitter<TPostEvents> {

  const postEvents: Emitter<TPostEvents> = mitt<TPostEvents>();

  postEvents.on('reaction',
    async ({club, clubApp, post, reaction, user}) => {
      await app.engines.motionEngine.processEvent(
        eventNames.post.reaction,
        {club, user, clubApp},
        {
          id: reaction.id,
          reaction: reaction.reaction,
          postId: post.id,
        },
      );
    },
  );

  postEvents.on('reaction',
    async ({club, clubApp, post, reaction, user}) => {
      app.log.info('post:reaction', {
        data: {
          clubId: club.id,
          postId: post.id,
          reaction: reaction.reaction,
          reactionId: reaction.id,
          userId: user.id,
        },
      });
      // app.log.info('post:reaction', { data: {club, clubApp, post, reaction, user}});

      const config = clubApp.config as {
        postThreshold?: number
        crowdpostingAppId?: string
      }

      if (config.postThreshold) {
        // todo: post reaction repo
        const rawReactions: { count: string, reaction: string }[] = await app.m.createQueryBuilder(PostReaction, 'pr')
          .select("COUNT(pr.reaction) AS count, pr.reaction")
          .where("pr.postId = :postId", {postId: post.id})
          .groupBy('pr.reaction')
          .getRawMany();

        const reactions = Object.fromEntries(rawReactions.map(r => [r.reaction, Number(r.count)])) || {};

        const total = (reactions['upvote'] || 0) - (reactions['downvote'] || 0);

        // post if threshold matched
        if (config.crowdpostingAppId && total >= config.postThreshold) {
          // post to Telegram

          const clubApp = await app.m.findOneBy(ClubApp, {
            id: config.crowdpostingAppId,
            club: {id: club.id},
          });

          if (clubApp) {
            //todo: factory of reposting apps
            const postingApp = new PostingApp(app, clubApp);
            await postingApp.post(post);
          } else {
            app.log.error("ClubApp is not found", {data: {appId: config.crowdpostingAppId, clubId: club.id}})
          }
        }
      }
    },
  );

  return postEvents;
}
