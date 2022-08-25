import App from '../App'
import Club from '../models/Club'
import ClubExt from '../models/ClubExt'
import ClubRole from '../models/ClubRole'
import * as querystring from 'querystring'
import {ExtService} from '../lib/enums'

export class ClubContext {
  readonly app: App;
  readonly club: Club;

  constructor(app: App, club: Club) {
    this.app = app;
    this.club = club;
  }

  get contextModels() {
    return {
      club: this.club,
    }
  }

  get contextModelIds() {
    return {
      club: {id: this.club.id},
    }
  }

  async telegramInviteLink() {
    const clubExt = await this.app.m.findOneBy(ClubExt, {
      service: ExtService.tg,
      ...this.contextModelIds,
    });

    if (!clubExt) {
      return null;
    }

    if (!clubExt.cached['chatInviteLink']) {
      const chatInviteLink = await this.app.TelegramContainer.Telegram.createChatInviteLink(clubExt.extId, {
        creates_join_request: true,
      });

      clubExt.cached['chatInviteLink'] = chatInviteLink.invite_link;

      await this.app.m.save(clubExt);
    }

    return clubExt.cached['chatInviteLink'];
  }

  clubLink(params: Record<string, string> = null, opts: {noLocalhost?: boolean} = {}) {
    let siteUrl = this.app.Env.siteUrl;
    if (opts.noLocalhost && siteUrl.startsWith('http://localhost')) {
      siteUrl = 'https://clubeeo.com';
    }

    const baseUrl = `${siteUrl}/${this.club.slug}`;

    if (params) {
      return `${baseUrl}?${querystring.stringify(params)}`
    } else {
      return baseUrl;
    }
  }

  getLogoLink() {
    let logo = this.club.style?.logoImg;
    if (logo && logo.startsWith('/')) logo = `${this.app.Env.siteUrl}/${logo}`
    return logo;
  }

  async snapshot() {
    const roles = await this.app.m.find(ClubRole, {
      where: {
        club: {id: this.club.id},
      },
      relations: {
        clubRoleTokens: {
          tokenContract: true,
        },
        userClubRoles: {
          user: {
            wallets: true
          },
        }
      }
    });

    //todo: member role name: forbid repetition

    return {
      name: this.club.name,
      roles: Object.fromEntries(roles.map((role) => {
        return [role.name, {
          allow: role.clubRoleTokens.map(clubRoleToken => {
            const tokenContract = clubRoleToken.tokenContract;

            return {
              address: tokenContract.address,
              chain: tokenContract.chain,
              standard: tokenContract.standard
            }
          }),
          members: role.userClubRoles.map(userClubRole => {
            const wallet = userClubRole.user.wallets[0];
            if (!wallet) return {};

            return {
              address: wallet.address,
              chain: wallet.chain,
            }
          }),
        }]
      }))
    }
  }
}

/**


 {
  name: "",
  roles: {
    "admin": {
      "allowlist": ["0x0000"],
      "denylist": [],
      "policies": ["owner"]
    },
    "member": {
      "allowlist": [{"ERC721": "0xffff0000"}],
      "policies": [{type:"telegram", chatId: "-1000"}]
    },
     ...
  },
}
 */
