/** Consume raw windows until a usable page is full or the server is exhausted. */
export async function collectDiscoverPage<T>(
  startPage: number,
  pageSize: number,
  readWindow: (page: number) => Promise<{ rows: T[]; count: number }>,
) {
  const rows: T[] = [];
  let page = startPage;
  let hasMore = false;
  do {
    const window = await readWindow(page);
    rows.push(...window.rows);
    hasMore = window.count > (page + 1) * pageSize;
    page++;
  } while (hasMore && rows.length < pageSize);
  return { rows, hasMore, lastPage: page - 1 };
}
