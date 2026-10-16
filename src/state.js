export const state = {
  menuCreated: false,
  menuCreating: false, // true while DOM is being built — guards monitorButtons from interfering
  clickAbortController: null,
};

export function resetState() {
  state.menuCreated = false;
  state.menuCreating = false;
  state.clickAbortController?.abort();
  state.clickAbortController = null;
}
