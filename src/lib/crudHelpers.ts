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
