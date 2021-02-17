import { GraphqlBatcher, GraphqlBatcherError } from '../../src/graphql-batcher';
import ApiBase from '../../src/api-base';

jest.mock('../../src/api-base');

describe('GraphQL batcher', () => {
  let batcher: GraphqlBatcher;

  beforeEach(() => {
    batcher = new GraphqlBatcher();
  });

  describe('.submit', () => {
    it('schedules a timer to fill the batch after 50 ms', () => {
      batcher.submit('{ __typename }');
      expect((batcher as any).timeout).toBeTruthy();
    });
    it('adds the submitted query to the query queue', () => {
      batcher.submit('{ __typename }');
      expect((batcher as any).queries).toEqual([
        {
          query: '{ __typename }',
          variables: undefined,
          callbacks: [
            {
              resolve: expect.any(Function),
              reject: expect.any(Function),
            },
          ],
        },
      ]);
    });
    it('adds two submitted queries to the query queue', () => {
      batcher.submit('{ __typename }');
      batcher.submit('{ me { id } }', { x: 1 });
      expect((batcher as any).queries).toEqual([
        {
          query: '{ __typename }',
          variables: undefined,
          callbacks: [
            {
              resolve: expect.any(Function),
              reject: expect.any(Function),
            },
          ],
        },
        {
          query: '{ me { id } }',
          variables: { x: 1 },
          callbacks: [
            {
              resolve: expect.any(Function),
              reject: expect.any(Function),
            },
          ],
        },
      ]);
    });
  });

  describe('.runBatch', () => {
    it('resolves multiple queries correctly', async () => {
      // set up mocks
      (ApiBase.queryGraph as unknown as jest.Mock).mockImplementation(
        async () => ({ data: [{ __typename: 'Query' }, { me: { id: 5 } }] }),
      );
      // set up internal state
      const promise1 = batcher.submit('{ __typename }');
      const promise2 = batcher.submit('{ me { id } }', { x: 1 });
      // clean-up internal timeouts
      clearTimeout((batcher as any).timeout);

      // verify that runBatch works
      await (batcher as any).runBatch();


      expect(promise1).resolves.toEqual({ __typename: 'Query' });
      expect(promise2).resolves.toEqual({ me: { id: 5 } });
    });
    it('rejects all queries with GraphqlBatcherError if data is null or errors present', async () => {
      // set up mocks
      (ApiBase.queryGraph as unknown as jest.Mock).mockImplementation(
        async () => ({ data: null, errors: [ { message: 'Broken stuff' }] }),
      );
      // set up internal state
      const promise1 = batcher.submit('{ __typename }');
      const promise2 = batcher.submit('{ me { id } }', { x: 1 });
      // clean-up internal timeouts
      clearTimeout((batcher as any).timeout);

      // verify that runBatch works
      await (batcher as any).runBatch();

      expect(promise1).rejects.toThrow(GraphqlBatcherError);
      expect(promise2).rejects.toThrow(GraphqlBatcherError);
    });
    it('does not throw a value error when query result is an error', async () => {
      // set up mocks
      (ApiBase.queryGraph as unknown as jest.Mock).mockImplementation(
        async () => ({ data: null, errors: [ { message: 'Broken stuff' }] }),
      );
      // set up internal state
      const promise1 = batcher.submit('{ __typename }');
      const promise2 = batcher.submit('{ me { id } }', { x: 1 });
      // clean-up internal timeouts
      clearTimeout((batcher as any).timeout);

      // verify that runBatch works
      await (batcher as any).runBatch();

      expect(promise1).rejects.not.toThrow('Cannot read property \'0\' of null');
      expect(promise2).rejects.not.toThrow('Cannot read property \'1\' of null');
    });
  });
});
