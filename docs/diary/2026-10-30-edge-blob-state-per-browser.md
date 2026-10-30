# Keep the edge blob state for the whole browser, not per site

**What changed** — `src/edgeBlob.js`: the blob state is stored under `menuEdgeBlob_{pageType}`
instead of `menuEdgeBlob_{pageType}_{origin}`. `loadBlobState` falls back to the old per-site key
when there is no shared record. `clearBlobState` removes the shared record and the old per-site
records of every site for that page type. Unit tests and e2e seeds use the new key; the chrome
mocks accept `get(null)`.

**Why** — buttons hidden in the blob on one Creatio site came back as free buttons on every other
site. Users work with many stands and expect the choice to follow them.

**Decision** — the key keeps the page type: shell, configuration and login pages have different
layouts. Old per-site records are read so a blob docked before the update is not lost, and are all
removed on the first tear-off, so a freed blob does not come back on another site from an old record.
The free drag position (`positionManager`) stays per site: it depends on each site's toolbar layout.
