const querystring = require('querystring');
const crypto = require('crypto');

export default class TgAppInitData {
  readonly initData: string;
  readonly tgToken: string;
  readonly initDataDec: string;
  readonly hash: string;

  constructor(initData: string, tgToken: string) {
    this.initData = initData;
    this.tgToken = tgToken;

    const initDataDec = this.parseInitDataDec(initData);
    this.hash = initDataDec['hash'];
    delete initDataDec['hash'];

    this.initDataDec = initDataDec;
  }

  parseInitDataDec(initData: string) {
    return querystring.decode(initData);
  }

  get initDataForSign() {
    const initDataDec = this.initDataDec;
    delete initDataDec['hash'];
    return Object.keys(initDataDec).sort().map(k => `${k}=${initDataDec[k]}`).join("\n");
  }

  get tgSecretKey() {
    return crypto.createHmac('sha256', 'WebAppData').update(this.tgToken).digest();
  }

  get initDataSignature() {
    return crypto.createHmac('sha256', this.tgSecretKey).update(this.initDataForSign).digest('hex');
  }

  get isInitDataValid() {
    return this.initDataSignature === this.hash;
  }

  get userData(): Partial<{id: number, first_name: string, last_name: string, username: string, language_code: string}> {
    return this.initDataDec['user'] ? JSON.parse(this.initDataDec['user']) : {}
  }

  get userId() {
    return this.userData.id;
  }
}
