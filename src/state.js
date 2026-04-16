export const state = {
  menuCreated: false,
  actionsMenuCreated: false,
  menuCreating: false, // true while DOM is being built — guards monitorButtons from interfering
  clickHandlerAttached: false,
};

export function resetState() {
  state.menuCreated = false;
  state.actionsMenuCreated = false;
  state.menuCreating = false;
  state.clickHandlerAttached = false;
}
