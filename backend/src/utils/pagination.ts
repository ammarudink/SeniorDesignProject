export const getPagination = (page?: number, limit?: number) => {
  const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Number(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && (limit ?? 0) > 0 ? Math.min(Number(limit), 100) : 12;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};
