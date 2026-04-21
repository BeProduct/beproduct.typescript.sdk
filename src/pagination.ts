export interface PageResult<T> {
  result: T[];
  total: number;
}

/** API uses 0-based page numbers (matching Python SDK behavior) */
export async function* paginate<T>(
  pageSize: number,
  fetchPage: (pageSize: number, pageNumber: number) => Promise<PageResult<T>>,
): AsyncGenerator<T> {
  let pageNumber = 0;
  let processed = 0;
  let total = 0;

  while (true) {
    const page = await fetchPage(pageSize, pageNumber);
    total = page.total;

    for (const item of page.result) {
      processed++;
      yield item;
    }

    if (processed >= total) break;
    pageNumber++;
  }
}

export async function collectAll<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) {
    items.push(item);
  }
  return items;
}
