import App from '../App'
import {StatusCodes} from 'http-status-codes'
import {Image} from '../models/Image'
import {getFileExt} from '../services/uploads/SimpleFileUploadService'
import {ExtError} from '../core/lib/ExtError'

export default function (app: App) {
  return function (router, opts, next) {

    router.post('/image', async (req, rep) => {
      const user = await app.auth.getUser(req);
      if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

      const options = {limits: {fileSize: 32 * 1024 * 1024}};
      const data = await req.file(options);

      const ext = getFileExt(data.filename);
      if (!['jpg', 'jpeg', 'png'].includes(ext)) throw `Unsupported image extension: ${ext}`;

      const uploadResult = await app.fileUploadService.upload(data.filename, data.file);

      // find top index image to setup new one
      const maxIndexImage = await app.m.findOne(Image, {
        where: {
          user: {id: user.id},
        },
        order: {index: 'DESC'},
      });

      const newIndex = (maxIndexImage?.index || 0) + 100;

      const image = app.m.create(Image, {
        uid: uploadResult.file.uid,
        ext: uploadResult.file.ext,
        user: {id: user.id},
        index: newIndex,
      });
      await app.m.save(image);

      rep.send({
        file: {
          name: uploadResult.file.name,
          path: uploadResult.file.path,
          uid: image.uid,
          ext: image.ext,
          index: image.index,
        },
      })
    });

    next();
  }
}
