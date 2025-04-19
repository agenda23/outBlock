// グローバル変数
let currentSettings = {
  enabled: true,
  blockedCount: 0,
  siteSettings: {}
};

// 初期化処理
function initialize() {
  // 設定を読み込む
  chrome.storage.sync.get(['enabled', 'blockedCount', 'siteSettings'], function(data) {
    // デフォルト値の設定
    const enabled = data.enabled !== undefined ? data.enabled : true;
    const blockedCount = data.blockedCount || 0;
    const siteSettings = data.siteSettings || {};
    
    // 現在の設定を保存
    currentSettings = {
      enabled: enabled,
      blockedCount: blockedCount,
      siteSettings: siteSettings
    };
    
    // アイコン状態の更新
    updateIcon(enabled);
    
    // Webリクエストフィルタの設定
    setupWebRequestFiltering();
  });
}

// アイコン状態の更新
function updateIcon(enabled) {
  const iconPath = enabled 
    ? { 
        16: chrome.runtime.getURL('icons/icon16.png'),
        48: chrome.runtime.getURL('icons/icon48.png'),
        128: chrome.runtime.getURL('icons/icon128.png')
      }
    : {
        16: chrome.runtime.getURL('icons/icon16_disabled.png'),
        48: chrome.runtime.getURL('icons/icon48_disabled.png'),
        128: chrome.runtime.getURL('icons/icon128_disabled.png')
      };
  
  chrome.action.setIcon({ path: iconPath });
}

// Webリクエストフィルタの設定
function setupWebRequestFiltering() {
  // Manifest V3では declarativeNetRequest APIを使用
  const rules = [
    {
      id: 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    },
    {
      id: 2,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*widgets.o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    },
    {
      id: 3,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*vra.o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    },
    {
      id: 4,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*vrp.o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    },
    {
      id: 5,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*vrt.o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    },
    {
      id: 6,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*mv.o-company.com*',
        resourceTypes: ['script', 'xmlhttprequest', 'sub_frame', 'other']
      }
    }
  ];

  // ここでは実際のルール適用はせず、コンテントスクリプトでの処理に委ねる
  console.log('O社関連ドメインのブロックルールを設定しました');
}

// コンテンツスクリプトからのメッセージ処理
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch(message.action) {
    case 'oCompanyDetected':
      handleOCompanyDetection(message, sender);
      break;
    case 'scriptBlocked':
      incrementBlockCount();
      break;
    case 'containerBlocked':
      incrementBlockCount();
      break;
    case 'toggleEnabled':
      toggleEnabled(message.enabled);
      break;
    case 'updateSiteSettings':
      updateSiteSettings(message.domain, message.enabled);
      break;
    case 'resetStats':
      resetBlockCount();
      break;
    case 'error':
      handleError(message);
      break;
    case 'getSiteSettings':
      getSiteSettings(sender.tab.url, sendResponse);
      return true; // 非同期レスポンスのためtrueを返す
    default:
      console.warn('未知のメッセージタイプ:', message.action);
  }
});

// O社広告検出の処理
function handleOCompanyDetection(message, sender) {
  console.log('O社広告を検出:', message.url);
  incrementBlockCount();
  
  // タブIDの取得
  const tabId = sender.tab.id;
  
  // アイコンバッジの更新
  updateBadge(tabId);
}

// ブロックカウントの増加
function incrementBlockCount() {
  currentSettings.blockedCount++;
  chrome.storage.sync.set({ blockedCount: currentSettings.blockedCount });
}

// ブロックカウントのリセット
function resetBlockCount() {
  currentSettings.blockedCount = 0;
  chrome.storage.sync.set({ blockedCount: 0 });
}

// 有効/無効の切り替え
function toggleEnabled(enabled) {
  currentSettings.enabled = enabled;
  chrome.storage.sync.set({ enabled: enabled });
  updateIcon(enabled);
}

// サイト固有の設定更新
function updateSiteSettings(domain, enabled) {
  if (!domain) return;
  
  currentSettings.siteSettings[domain] = enabled;
  chrome.storage.sync.set({ siteSettings: currentSettings.siteSettings });
}

// サイト固有の設定取得
function getSiteSettings(url, sendResponse) {
  if (!url) {
    sendResponse({ enabled: currentSettings.enabled });
    return;
  }
  
  try {
    const domain = new URL(url).hostname;
    const siteEnabled = currentSettings.siteSettings[domain] !== undefined 
      ? currentSettings.siteSettings[domain] 
      : currentSettings.enabled;
    
    sendResponse({
      enabled: siteEnabled,
      globalEnabled: currentSettings.enabled,
      domain: domain
    });
  } catch (e) {
    console.error('URLの解析エラー:', e);
    sendResponse({ enabled: currentSettings.enabled });
  }
}

// バッジの更新
function updateBadge(tabId) {
  chrome.action.setBadgeText({
    text: currentSettings.blockedCount.toString(),
    tabId: tabId
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: '#E03131',
    tabId: tabId
  });
}

// エラー処理
function handleError(message) {
  console.error('拡張機能エラー:', message.error);
  console.error('スタックトレース:', message.stack);
}

// 拡張機能インストール/更新時の処理
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // インストール時の初期設定
    const initialSettings = {
      enabled: true,
      blockedCount: 0,
      siteSettings: {}
    };
    
    chrome.storage.sync.set(initialSettings, function() {
      console.log('拡張機能がインストールされ、初期設定が完了しました');
    });
  }
});

// 初期化実行
initialize();