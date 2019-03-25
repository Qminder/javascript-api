import { GraphqlResponse } from './api-base';
import ApiBase from './api-base';

interface PendingQuery {
  query: string;
  originalName: string;
  callbacks: [Function];
}

export class GraphqlBatcher {
  private timeout: any;
  private queries: PendingQuery[] = [];

  submit(query: string): Promise<GraphqlResponse> {
    if (!this.timeout) {
      this.timeout = setTimeout(this.runBatch.bind(this), 50);
    }

    let callback: Function = null;
    const promise = new Promise((resolve => {
      callback = resolve;
    })) as Promise<GraphqlResponse>;

    const packedQuery = query.replace(/\s\s+/g, ' ').trim();
    let existingPendingQuery = this.queries.find(q => q.query === packedQuery);
    if (existingPendingQuery) {
      existingPendingQuery.callbacks.push(callback);
      return promise;
    }

    const originalName = packedQuery.substr(0, packedQuery.indexOf('{')).trim();
    this.queries.push({
      query: packedQuery,
      originalName,
      callbacks: [callback],
    });

    return promise;
  }

  private runBatch() {
    const batch = this.queries.slice(0);
    this.queries = [];
    this.timeout = undefined;

    let batchedQuery = '';
    let id = 1;
    for (const pendingQuery of batch) {
      batchedQuery += `q${id}: ${pendingQuery.query} \n`;
      id++;
    }
    batchedQuery = `query { ${batchedQuery} }`;

    ApiBase.queryGraph(batchedQuery.trim()).then((result: any) => {
      let id = 1;
      for (const pendingQuery of batch) {
        const data: { [id: string] : any } = {};
        data[pendingQuery.originalName] = result.data[`q${id}`];
        pendingQuery.callbacks.forEach(callback => callback({ data }));
        id++;
      }
    });
  }
}
