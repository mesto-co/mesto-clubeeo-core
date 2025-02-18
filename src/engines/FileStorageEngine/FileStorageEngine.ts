import { DataSource, EntityTarget, Repository } from "typeorm";
import { fileEntityFactory } from "./models/fileEntityFactory";
import fs from 'fs';
import axios from 'axios';
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { ContainerBase } from '../../core/lib/ContainerBase';

export interface IFileStorageEngineDeps<
  TUser extends EntityTarget<{ id: string }> = any
> {
  logger: pino.Logger;
  db: DataSource;
  models: {
    User: TUser;
  }
}

export function fileStorageEngine<
  TApp extends IFileStorageEngineDeps
>(c: TApp) {
  const models = {
    File: fileEntityFactory({ entity: { name: 'file' }, User: c.models.User }),
  };

  const repos = class extends ContainerBase {
    get fileRepo() {
      return c.db.getRepository(models.File);
    }
  };

  const actions = {
    async createFromUrl(url: string) {
      const localFilePath = await this.downloadFromUrlToLocal(url);
    },
    async downloadFromUrlToLocal(url: string) {
      let extension = path.extname(url);
      extension = extension.substring(0, 4);

      const response = await axios.get(url, { responseType: 'stream' });
      const stream = response.data;

      const localFilePath = path.join('/tmp', `${uuidv4()}${extension}`);

      // Save file to /tmp directory and serve it
      const writable = fs.createWriteStream(localFilePath);

      await new Promise((resolve, reject) => {
        stream.on('data', data => {
          writable.write(data);
        });

        stream.on('end', () => {
          writable.end();
          c.logger.info('file downloaded', localFilePath);
          resolve(true);
        });

        stream.on('error', (error) => {
          c.logger.error('stream error', error);
          fs.unlinkSync(localFilePath);
          reject(error);
        });
      });

      stream.on('error', (error) => {
        c.logger.error('stream error', error);
        fs.unlinkSync(localFilePath);
        throw error;
      });

      return localFilePath;
    }
  };

  return {
    models,
    repos,
    actions,
  };

  // return class FileStorageEngine {
  //   readonly type = "engine";

  //   models = models;
  //   // repos = repos;
  //   // actions,
  // };
}

// export class FileStorageEngine<
//   TApp extends IFileStorageEngineDeps
// > extends ContainerBase {  
//   readonly type = "engine";

//   constructor(protected c: TApp) {
//     super();
//   }

//   get models() {
//     return this.once('models', () => {
//       const File = fileEntityFactory({ entity: { name: 'file' }, User: this.c.models.User });
//       return {
//         File,
//       };
//     });
//   }

//   get repos() {
//     return this.once('repos', () => {
//       return {
//         File: this.c.db.getRepository(this.models.File),
//       };
//     });
//   }

//   get actions() {
//     return this.once('actions', () => {
//       return new FileStorageActions(this.c, this);
//     });
//   }
// }

// export class FileStorageActions<
//   TApp extends IFileStorageEngineDeps
// >  {
//   constructor(protected c: TApp, protected engine: FileStorageEngine<TApp>) {}

//   async createFromUrl(url: string) {
//     const localFilePath = await this.downloadFromUrlToLocal(url);

//     const file = await this.engine.repos.File.create({
//       path: localFilePath,
//     });
//   }

//   async downloadFromUrlToLocal(url: string) {
//     let extension = path.extname(url);
//     extension = extension.substring(0, 4);

//     const response = await axios.get(url, { responseType: 'stream' });
//     const stream = response.data;

//     const localFilePath = path.join('/tmp', `${uuidv4()}${extension}`);

//     // Save file to /tmp directory and serve it
//     const writable = fs.createWriteStream(localFilePath);

//     await new Promise((resolve, reject) => {
//       stream.on('data', data => {
//         writable.write(data);
//       });

//       stream.on('end', () => {
//         writable.end();
//         resolve(true);
//       });

//       stream.on('error', (error) => {
//         this.c.logger.error('stream error', error);
//         fs.unlinkSync(localFilePath);
//         reject(error);
//       });
//     });

//     stream.on('error', (error) => {
//       this.c.logger.error('stream error', error);
//       fs.unlinkSync(localFilePath);
//       throw error;
//     });

//     return localFilePath;
//   }
// }
