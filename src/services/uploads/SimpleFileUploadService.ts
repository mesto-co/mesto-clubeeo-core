import {nanoid} from 'nanoid'

const fs = require('fs')
const util = require('util')
const {pipeline} = require('stream')
const pump = util.promisify(pipeline)


export function getFileExt(name: string): string {
  return name.split('.').pop().toLowerCase()
}

export interface ISimpleFileUploadService_Deps {
  Env: {
    rootDir: string
  },
  nanoid: (size?: number) => string
}

/**
 * handles file uploads to file system
 */
export class SimpleFileUploadService {
  protected deps: ISimpleFileUploadService_Deps

  constructor(app: ISimpleFileUploadService_Deps) {
    this.deps = app
  }

  async upload(fileName: string, fileData) {
    const ext = getFileExt(fileName);
    const uid = nanoid(32);

    const name = `${uid}.${ext}`;
    const path = `static/uploads/${name}`;
    const fullName = `${this.deps.Env.rootDir}/${path}`;
    await pump(fileData, fs.createWriteStream(fullName));

    return {
      file: {
        name,
        path,
        uid,
        ext,
      },
    }
  }

}
