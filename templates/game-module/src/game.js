// State belongs only to this document. No shared gameplay globals or parent API.
(() => {
  let clicks = 0;
  document.getElementById('play').addEventListener('click', () => {
    clicks++;
    document.getElementById('result').textContent = `Module đang chạy độc lập · ${clicks} lượt bấm.`;
  });
  // If you add persistence, prefix every storage key with your game id: my-game:...
})();
