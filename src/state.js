export const state = {
  menuCreated: false,
  actionsMenuCreated: false,
  menuCreating: false, // true while DOM is being built — guards monitorButtons from interfering
};

export function resetState() {
  state.menuCreated = false;
  state.actionsMenuCreated = false;
  state.menuCreating = false;
}
