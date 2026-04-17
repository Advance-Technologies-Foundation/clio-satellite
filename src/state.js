export const state = {
  menuCreated: false,
  actionsMenuCreated: false,
  menuCreating: false, // true while DOM is being built — guards monitorButtons from interfering
  clickAbortController: null,
};

export function resetState() {
  state.menuCreated = false;
  state.actionsMenuCreated = false;
  state.menuCreating = false;
  state.clickAbortController?.abort();
  state.clickAbortController = null;
}
