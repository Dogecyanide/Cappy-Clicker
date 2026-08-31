export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  let revision = 0;

  return {
    get state() { return state; },
    get revision() { return revision; },
    replace(nextState, reason = 'replace') {
      state = nextState;
      revision += 1;
      for (const listener of listeners) listener(state, reason, revision);
    },
    mutate(reason, operation) {
      const result = operation(state);
      revision += 1;
      for (const listener of listeners) listener(state, reason, revision);
      return result;
    },
    notify(reason = 'update') {
      revision += 1;
      for (const listener of listeners) listener(state, reason, revision);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

