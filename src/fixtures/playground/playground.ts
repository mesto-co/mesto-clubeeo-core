const playgroundClubData = {
  slug: 'playground',
  name: 'Clubeeo Playground',
  description: '<div><span style="background-color: transparent;">Here you can play with creating clubs, installing and using apps, and automating them with no-code editor.</span><br></div><div><br></div><div>New features and apps appear here&nbsp;<span style="background-color: transparent;">first</span><span style="background-color: transparent;">, so you can try them before release. Right now it\'s the upcoming Q1 2023 release preview. Work in progress on the full set of features.</span></div><div><br></div><div>It\'s a playground and it might be reset with new updates. Treat it like a testnet.</div><div><span style="background-color: transparent;"><br></span></div><div><span style="background-color: transparent;">When you are ready to go to production, please:&nbsp;</span></div><div><div><br></div><div><div class="text-center q-pb-md"><a class="q-btn q-btn-item non-selectable no-outline q-btn--unelevated q-btn--rectangle q-btn--actionable q-focusable q-hoverable q-btn--no-uppercase clubButtonActive q-btn--active" tabindex="0" href="https://forms.gle/1ASbh4NCCLqwdCXx8" target="_blank" style="font-size: 24px; border-radius: 8px;"><span class="q-btn__content text-center col items-center q-anchor--skip justify-center row">apply for beta</span></a></div><div><br></div><div><br></div><div><br></div></div></div>',
  welcome: '',
  website: '',
  buyLinks: {},
  socialLinks: {"tiktok":null,"telegram":"https://t.me/clubeeo","discord":"https://discord.gg/C6jHsjzZ3f","instagram":"","twitter":"https://twitter.com/ClubeeoOfficial","etherscan":null,"reddit":"https://www.reddit.com/r/clubeeo","facebook":"","linkedin":"https://www.linkedin.com/company/clubeeo","youtube":null,"web":""},
  roadmap: {},
  style: {},
  settings: {},

  roles: [
    {name: 'admin'},
    {name: 'member'},
    // {name: 'public'}, //todo: remove
    {name: '@everyone'},
  ],

  clubApps: [
    {
      appSlug: 'join-eth',
      appName: 'eth-wallet',
      title: 'join with wallet',
      menuIndex: 100,
      config: {},
      club: {slug: 'playground'},
      roles: {
        '@everyone': [{accessTo: 'page:'}],
      }
    },
    {
      appSlug: 'gated-content-tutorial',
      appName: 'page',
      title: 'gated content tutorial',
      menuIndex: 200,
      config: {"content":"<div><div>You may want to create content pages available to community members only. To do so you need to create the page itself, mount it to the menu and set up role-based access to it.</div><div><br></div><div>Steps to create a page accessible to members with certain role:</div><div><br></div><div>1. Create a role. Go to \"roles\" &gt; \"add role\" to create a new role. Let's call it \"holder\".</div><div><br></div></div>2. Create a content page. To do so go to \"apps\" &gt; \"registry\" and find the \"page\" app.<div><div><img src=\"/static/uploads/UOkPQnouPeCgiHmMfZCYL7czk03nHqm5.png\" style=\"max-width: min(500px, 100%)\"></div><br></div><div>3. Add content using the editor. You can copy HTML code to the editor, e.g. embed a Youtube video.</div><img src=\"/static/uploads/k4tdXxejeK4QhzkEGJkDYQ1yjv44_Tex.png\" style=\"max-width: min(500px, 100%)\"><div><br></div><div>4. Click install</div><div><br></div><div>5. Go to the \"permissions\" tab on your app page. Click \"+\" on the \"roles\" card. Put the check next to the \"holder\" role and click save.</div><div><br></div><div>Now this page will be available for members with a \"holder\" role.</div><div><br></div><div>You can grant this role manually. To do so, navigate to \"members\", click the cog next to member and edit roles.</div><div><br></div><div>You can also grant roles to your token holders automatically using clubeeo.com. We will soon add this feature to the playground and update the tutorial.</div>"},
      club: {slug: 'playground'},
      roles: {
        'member': [{accessTo: 'page:'}],
      }
    },
    {
      appSlug: 'leaderboard',
      appName: 'leaderboard',
      title: 'leaderboard',
      menuIndex: 300,
      config: {"badgeId":"1"},
      club: {slug: 'playground'},
      roles: {
        'member': [{accessTo: 'page:'}],
      }
    },
    {
      appSlug: 'clubeeo-app',
      appName: 'clubeeo-app',
      title: 'Clubeeo app',
      menuIndex: null,
      config: {},
      club: {slug: 'playground'}
    },
  ],

  clubBadges: [
    {
      name: 'activity points',
      title: 'activity points',
      description: '',
      slug: 'activity-points',
      img: '/static/uploads/RxBhsezeosa7poGOs0LYXP502JxlZOVN.png',
      style: {},
      badgeType: 'score',
    }
  ],

  motionTriggers: [
    {
      id: 1,
      name: 'join with wallet: grant member role',
      eventType: 'ethWallet:login',
      actionType: 'role:grant',
      eventProps: {},
      actionProps: {"roleId":2},
      data: {},
      processor: {"type":"bypass","opts":{}},
      enabled: true,
      eventClubApp: {appSlug: 'join-eth'},
      actionClubApp: {appSlug: 'clubeeo-app'},
    },
    {
      id: 2,
      name: 'join with wallet: grant member badge',
      eventType: 'ethWallet:login',
      actionType: 'badge:grant',
      eventProps: {},
      actionProps: {"badgeId":1},
      data: {},
      processor: {"type":"bypass","opts":{}},
      enabled: true,
      eventClubApp: {appSlug: 'join-eth'},
      actionClubApp: {appSlug: 'clubeeo-app'},
    },
  ],
}

// const clubOwnerUserData = {
//   email: null,
//   screenName: '',
//   imgUrl: '',
//   confirmed: true,
//   timezone: '',
//   lang: '',
//   // activeClubId: null
// }
