import { EngineBase } from "clubeeo-core";
import { MestoApp } from "../../App";
import { listsApi } from "./listsApi";
import { ILike } from 'typeorm';
import ListType from "./models/ListType";
import ListItem from "./models/ListItem";
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import path from "path";

export class Lists extends EngineBase {
  readonly type = "engine";

  service: ListsService;

  constructor(protected c: MestoApp) {
    super();

    this.service = new ListsService(c, this);
  }

  get api() { return listsApi(this.c, this) }
  apiConfig = { prefix: '/lists' }

  async fixtures() {
    await this.service.findOrCreateType({
      slug: 'professions',
      name: 'Профессии',
    });

    await this.service.loadCsvFile({
      listGroupSlug: 'professions',
      filePath: path.join(__dirname, 'fixtures/professions.csv'),
    });

    await this.service.findOrCreateType({
      slug: 'activity-spheres',
      name: 'Сферы деятельности',
    });

    await this.service.loadCsvFile({
      listGroupSlug: 'activity-spheres',
      filePath: path.join(__dirname, 'fixtures/activity-spheres.csv'),
    });
  }

  async run() {
  }

  models = {
    ListType,
    ListItem,
  }
}

export class ListsService {
  constructor(protected c: MestoApp, protected lists: Lists) {}

  async searchItems({ listGroupSlug, search, take, skip }: {
    listGroupSlug: string;
    search: string;
    take: number;
    skip: number;
  }) {
    const listGroup = await this.c.m.findOneByOrFail(ListType, {
      slug: listGroupSlug || '',
    });

    let where = {
      group: { id: listGroup.id },
    };

    if (typeof search === 'string') {
      where['name'] = ILike(`%${search}%`);
    }

    const data = await this.c.m.find(ListItem, {
      where,
      order: { name: 'ASC' },
      take, skip,
    });

    return {data, take, skip, listGroup};
  }

  async createType({ slug, name, hint, data }: { slug: string; name: string; hint?: string; data?: Record<string, string> }) {
    return this.c.m.save(ListType, {
      slug,
      name: name || slug,
      hint,
      data: data || {}
    });
  }

  async findOrCreateType({ slug, name, hint, data }: { slug: string; name: string; hint?: string; data?: Record<string, string> }) {
    try {
      return await this.c.em.findOneOrCreateBy(ListType, { slug }, {
        name: name || slug,
        hint,
        data: data || {}
      });
    } catch (err) {
      console.error(err);
    }
  }

  async loadCsvFile({
    listGroupSlug,
    filePath,
  }: {
    listGroupSlug: string;
    filePath: string;
  }): Promise<void> {
    const listType = await this.c.m.findOneByOrFail(ListType, {
      slug: listGroupSlug,
    });

    // const stripBomStream = await import('strip-bom-stream');

    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath)
        // .pipe(stripBomStream())
        .pipe(csvParser());

      stream
        .on('data', (row) => {
          // const cleanRow = {};
          // for (const key in row) {
          //   const cleanKey = stripBom(key);  // Strip BOM from each key
          //   cleanRow[cleanKey] = row[key];
          // }

          const [name] = Object.values(row) as string[];

          stream.pause();

          this.c.em.createOrUpdateBy(ListItem, {
            name,
            group: {id: listType.id},
          }, {
            data: {...row,name},
          }).then((item) => {
            stream.resume();
            this.c.logger.info('resume');
          }).catch(err => {
            this.c.logger.error(err)
            reject(err);
          });
          // reject('not implemented');
        })
        .on('end', async () => {
          try {
            // await this.c.m.save(ListItem, items);
            resolve();
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}
