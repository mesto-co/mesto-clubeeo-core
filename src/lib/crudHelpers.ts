import {id, int, obj} from 'json-schema-blocks'

export const simplePaginator = (query: {page?: number | null, take?: number | null}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const take = Math.max(Number(query.take || 100), 1);
  const skip = (page - 1) * take;

  return {
    page,
    take,
    skip,
  }
}

export const simplePaginatorQuery = obj({
  page: id(),
  take: int(1, 1000),
}, {
  optional: ['page', 'take'],
});

// export function objJoin(...objs: {type: 'object', properties: object, required?: Array<string>}[]) {
//   return {
//     type: 'object',
//     properties: objs.reduce((memo, val) => Object.assign(memo, val.properties), {}),
//     required: objs.reduce((memo, val) => memo.push(...(val.required || [])), []),
//   }
// }
