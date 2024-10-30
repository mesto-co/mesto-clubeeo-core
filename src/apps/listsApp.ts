import { MestoApp } from "../App";
import { AppBuilder } from "../lib/createApp";
import ListType from '../engines/Lists/models/ListType';
import ListItem from '../engines/Lists/models/ListItem';

export class ListsRepo {
  constructor(protected c: MestoApp) {}

  // Fetch paginated list of users by role
  async fetchListsTypes() {
    const listsTypes = await this.c.m.find(ListType);

    return { listsTypes };
  }

  async fetchListsByType(type: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    let where = {}

    if (type) {

      where = {
        group: {
          slug: type || ''
        },
      };
    }


    const [lists, total] = await this.c.m.findAndCount(ListItem, {
      where,
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    return {
      lists,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}

export class ListEntity {
  repo: ListsRepo;

  constructor(public c: MestoApp) {
    this.repo = new ListsRepo(c);
  }
}

const listsApp = new AppBuilder<MestoApp, ListEntity>('mesto-lists', (c) => new ListEntity(c));

listsApp.get('/lists-types', {}, async ({ repo }, {}, reply) => {
  const listsTypes = await repo.fetchListsTypes();

  return {
    data: listsTypes,
  };
});

listsApp.get('/lists', {
  schema: {
    querystring: {
      listType: { type: 'string', default: ''},
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 20 },
    },
  }
}, async ({ repo }, { query }, reply) => {
  const { listType, page, limit } = query;
  const lists = await repo.fetchListsByType(listType, page, limit);
  
  return { data: lists };
});

export default listsApp;