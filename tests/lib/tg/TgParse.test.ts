import {expect} from 'chai';
import {getCommandAndParam} from '../../../src/clubApps/TelegramApp/lib/TgParse'


describe('getCommandAndParam', function () {
  it('returns command and param', function () {
    const result = getCommandAndParam('/start DATA');

    expect(result).deep.equal({command: '/start', param: 'DATA'});
  });

  it('returns multiple params divided by spaces', function () {
    const result = getCommandAndParam('/start  DATA data2   data3 ');

    expect(result).deep.equal({command: '/start', param: 'DATA data2   data3'});
  });

  it('returns command and empty param when there\'s no param', function () {
    const result = getCommandAndParam('/start');

    expect(result).deep.equal({command: '/start', param: ''});
  });

  it('returns empty command and param when there\'s no command', function () {
    const result = getCommandAndParam('hello!');

    expect(result).deep.equal({command: '', param: ''});
  });

  it('returns empty command and param for empty string', function () {
    const result = getCommandAndParam('hello!');

    expect(result).deep.equal({command: '', param: ''});
  });

  it('returns empty command and param for empty command', function () {
    const result = getCommandAndParam('/');

    expect(result).deep.equal({command: '/', param: ''});
  });
});
