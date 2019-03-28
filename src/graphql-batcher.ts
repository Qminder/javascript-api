import { GraphqlQuery, GraphqlResponse } from './api-base';
import ApiBase from './api-base';

interface PendingQuery {
  query: string;
  variables?: { [key: string]: any }
  callbacks: {resolve: Function, reject: Function}[];
}

export class GraphqlBatcher {
  private timeout: any;
  private queries: PendingQuery[] = [];

  submit(query: string, variables?: { [key: string]: any }): Promise<GraphqlResponse> {
    if (!this.timeout) {
      this.timeout = setTimeout(this.runBatch.bind(this), 50);
    }

    let callbackResolve: Function = null;
    let callbackReject: Function = null;
    const promise = new Promise(((resolve, reject) => {
      callbackResolve = resolve;
      callbackReject = reject;
    })) as Promise<GraphqlResponse>;

    const packedQuery = query.replace(/\s\s+/g, ' ').trim();

    if (!variables) {
      let existingPendingQuery = this.queries.find(q => q.query === packedQuery);
      if (existingPendingQuery) {
        existingPendingQuery.callbacks.push({
          resolve: callbackResolve,
          reject: callbackReject,
        });
        return promise;
      }
    }

    this.queries.push({
      query: packedQuery,
      variables,
      callbacks: [{
        resolve: callbackResolve,
        reject: callbackReject,
      }],
    });

    return promise;
  }

  private async runBatch() {
    const batch = this.queries.slice(0);
    this.queries = [];
    this.timeout = undefined;

    let batchedPayload = [];
    for (const pendingQuery of batch) {
      const query: GraphqlQuery = {
        query: pendingQuery.query,
      };
      if (pendingQuery.variables) {
        query.variables = pendingQuery.variables;
      }
      batchedPayload.push(query);
    }

    try {
      const result = await ApiBase.queryGraph(batchedPayload);
      let i = 0;
      for (const pendingQuery of batch) {
        const data = result.data[i];
        pendingQuery.callbacks.forEach(callback => callback.resolve(data));
        i++;
      }
    } catch (e) {
      for (const pendingQuery of batch) {
        pendingQuery.callbacks.forEach(callback => callback.reject(e));
      }
    }
  }
}
