import {simplePaginator} from '../../src/lib/crudHelpers';
import {expect} from 'chai';


describe('simplePaginator', function () {
  it('returns default values for empty query', function () {
    const result = simplePaginator({});
    expect(result).deep.equal({
      page: 1,
      take: 100,
      skip: 0,
    });
  });

  it('calculates skip amount based on page (default "take")', function () {
    const result = simplePaginator({page: 3});
    expect(result).deep.equal({
      page: 3,
      take: 100,
      skip: 200,
    });

    const result2 = simplePaginator({page: 10});
    expect(result2).deep.equal({
      page: 10,
      take: 100,
      skip: 900,
    });
  });

  it('calculates skip amount based on page (custom "take")', function () {
    const result = simplePaginator({page: 3, take: 1000});
    expect(result).deep.equal({
      page: 3,
      take: 1000,
      skip: 2000,
    });

    const result2 = simplePaginator({page: 10, take: 1});
    expect(result2).deep.equal({
      page: 10,
      take: 1,
      skip: 9,
    });
  });

  it('use nearest value if negative values passed', function () {
    const result = simplePaginator({page: -10});
    expect(result).deep.equal({
      page: 1,
      take: 100,
      skip: 0,
    });

    const result2 = simplePaginator({take: -100});
    expect(result2).deep.equal({
      page: 1,
      take: 1,
      skip: 0,
    });
  });

  it('use default value if zero values passed', function () {
    const result = simplePaginator({page: 0});
    expect(result).deep.equal({
      page: 1,
      take: 100,
      skip: 0,
    });

    const result4 = simplePaginator({take: 0});
    expect(result4).deep.equal({
      page: 1,
      take: 100,
      skip: 0,
    });
  });
});
