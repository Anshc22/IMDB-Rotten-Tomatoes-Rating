document.getElementById('saveBtn').onclick = function() {
  const key = document.getElementById('apiKey').value.trim();
  chrome.storage.sync.set({ omdbApiKey: key }, () => {
    document.getElementById('status').textContent = 'API Key saved!';
    setTimeout(() => document.getElementById('status').textContent = '', 1500);
  });
};

chrome.storage.sync.get('omdbApiKey', (data) => {
  if (data.omdbApiKey) document.getElementById('apiKey').value = data.omdbApiKey;
});
