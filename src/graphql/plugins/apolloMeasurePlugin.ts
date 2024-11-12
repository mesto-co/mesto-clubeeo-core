'use strict';

const executionTimeThreshold = 1000;

function extractPathKeysRec(obj, keys = []) {
  keys.push(obj.key);
  if (obj.prev) {
    extractPathKeysRec(obj.prev, keys);
  }
  return keys;
}

function extractPathKeys(obj) {
  return extractPathKeysRec(obj).reverse();
}

export function apolloMeasurePlugin(c, {
  threshold = executionTimeThreshold,
} = {}) {
  return {
    async requestDidStart(requestContext) {
      const start = Date.now();

      return {
        async executionDidStart() {
          return {
            willResolveField(fieldContext) {
              const resolverStart = Date.now();

              return () => {
                const resolverEnd = Date.now();
                const executionTime = resolverEnd - resolverStart;

                if (executionTime >= threshold) {
                  const gqlPath = extractPathKeys(fieldContext.info.path).join(
                    '.',
                  );
                  c.logger.info(
                    { gqlPath },
                    `Resolver ${gqlPath} execution time: ${executionTime}ms`,
                  );
                }
              };
            },
          };
        },

        async didEncounterErrors(errorContext) {
          const end = Date.now();
          const executionTime = end - start;

          if (executionTime >= threshold) {
            const operationName = errorContext?.operation?.name?.value;
            c.logger.info(
              { operationName },
              `Query ${operationName} execution time: ${executionTime}ms and produced error`,
            );
          }
        },

        async willSendResponse(responseContext) {
          const end = Date.now();
          const executionTime = end - start;
          if (executionTime >= threshold) {
            const operationName = responseContext?.operation?.name?.value;
            c.logger.info(
              { operationName },
              `Query ${operationName} execution time: ${executionTime}ms`,
            );
          }
        },
      };
    },
  };
};
