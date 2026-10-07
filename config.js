// The Rift Run iPad installation (07.10.2026). Own installer, adapted from the
// Lesson Arcade Cup installer; the Cup installers stay unchanged.
// startFile: the real game page inside the delivery ZIP (not the outer redirect).
// markers: ids the game page must contain, so a foreign ZIP is rejected.
// backLinkAfter: where the "iPad-Installation / Update" link is added in the game.
globalThis.RiftInstallEdition = Object.freeze({
  id: "rift-run",
  name: "The Rift Run",
  startFile: "games/irregular-verb-race/START.html",
  title: "The Rift Run",
  markers: ["hub", "gameScene"],
  backLinkAfter: "#hubSettingsTitle"
});
