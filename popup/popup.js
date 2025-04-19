document.addEventListener('DOMContentLoaded', function() {
  // UI要素の参照を取得
  const enableToggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const blockedCount = document.getElementById('blockedCount');
  const currentSite = document.getElementById('currentSite');
  const siteToggle = document.getElementById('siteToggle');
  const resetStats = document.getElementById('resetStats');
  
  // 現在のタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs.length > 0) {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      currentSite.textContent = domain;
      
      // 現在の設定を読み込み
      chrome.storage.sync.get(['enabled', 'blockedCount', 'siteSettings'], function(data) {
        // 全体的な有効/無効状態
        const enabled = data.enabled !== undefined ? data.enabled : true;
        enableToggle.checked = enabled;
        statusText.textContent = enabled ? '有効' : '無効';
        
        // ブロック統計
        blockedCount.textContent = data.blockedCount || 0;
        
        // サイト固有の設定
        const siteSettings = data.siteSettings || {};
        const siteEnabled = siteSettings[domain] !== undefined ? siteSettings[domain] : enabled;
        siteToggle.checked = siteEnabled;
      });
    } else {
      currentSite.textContent = '現在のタブ情報を取得できません';
    }
  });
  
  // 全体的な有効/無効トグル
  enableToggle.addEventListener('change', function() {
    const enabled = enableToggle.checked;
    statusText.textContent = enabled ? '有効' : '無効';
    
    // 設定を保存
    chrome.storage.sync.set({ enabled: enabled }, function() {
      // バックグラウンドスクリプトに通知
      chrome.runtime.sendMessage({
        action: "toggleEnabled",
        enabled: enabled
      });
      
      // 現在のタブをリロード
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  });
  
  // サイト固有のトグル
  siteToggle.addEventListener('change', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        const siteEnabled = siteToggle.checked;
        
        chrome.storage.sync.get(['siteSettings'], function(data) {
          const siteSettings = data.siteSettings || {};
          siteSettings[domain] = siteEnabled;
          
          // 設定を保存
          chrome.storage.sync.set({ siteSettings: siteSettings }, function() {
            // バックグラウンドスクリプトに通知
            chrome.runtime.sendMessage({
              action: "updateSiteSettings",
              domain: domain,
              enabled: siteEnabled
            });
            
            // 現在のタブをリロード
            chrome.tabs.reload(tabs[0].id);
          });
        });
      }
    });
  });
  
  // 統計リセット
  resetStats.addEventListener('click', function() {
    chrome.storage.sync.set({ blockedCount: 0 }, function() {
      blockedCount.textContent = '0';
      
      // バックグラウンドスクリプトに通知
      chrome.runtime.sendMessage({
        action: "resetStats"
      });
    });
  });
});