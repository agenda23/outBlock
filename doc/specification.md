# Outbrain社ブラウザバック広告ブロック拡張機能 詳細仕様書

## 1. 製品概要

### 1.1 製品名
**OutBlocker** - Outbrain社ブラウザバック広告ブロック拡張機能

### 1.2 目的
Outbrain社が提供するブラウザバック広告（「戻る」ボタンを押した際に表示される広告）をブロックし、ユーザーのウェブブラウジング体験を向上させる。

### 1.3 対象環境
- **ブラウザ**: Google Chrome (バージョン88以上)
- **OS**: Windows, macOS, Linux (Chrome browserがサポートする全てのプラットフォーム)

## 2. 機能仕様

### 2.1 コア機能

#### 2.1.1 History API監視機能
| 機能ID | 機能名 | 説明 |
|--------|--------|------|
| F-01 | History API監視 | ウェブページ内でのHistory API（history.pushState, history.replaceState）の呼び出しを検出・監視する |
| F-02 | Outbrain広告パターン検出 | URLパターンや操作シーケンスからOutbrain広告の挿入を識別する |
| F-03 | 履歴操作防止 | 不正な履歴操作を検出した場合に、その操作をブロックまたは元に戻す |

#### 2.1.2 リソースブロック機能
| 機能ID | 機能名 | 説明 |
|--------|--------|------|
| F-04 | Outbrainドメインフィルタリング | Outbrain関連ドメインからのリソース読み込みをブロックする |
| F-05 | スクリプトブロック | Outbrain広告関連のJavaScriptコードの実行をブロックする |
| F-06 | フォールバック防止 | 代替広告表示メカニズムへのフォールバックを防止する |

#### 2.1.3 ユーザーインターフェース
| 機能ID | 機能名 | 説明 |
|--------|--------|------|
| F-07 | ステータス表示 | 拡張機能の有効/無効状態を示すアイコンを表示 |
| F-08 | オン/オフ切り替え | 拡張機能の機能を有効/無効にするトグルスイッチ |
| F-09 | 統計情報表示 | ブロックされた広告数などの統計情報を表示 |
| F-10 | サイト単位の設定 | 特定のサイトでのみ有効/無効にする設定 |

### 2.2 拡張機能アーキテクチャ

#### 2.2.1 コンポーネント構成
```
OutbrainBlocker/
├── manifest.json       # 拡張機能のメタデータと設定
├── background/         # バックグラウンド処理
│   └── background.js   # バックグラウンドスクリプト
├── content/            # コンテンツスクリプト
│   ├── detector.js     # History API監視
│   └── blocker.js      # 広告ブロック処理
├── popup/              # ポップアップUI
│   ├── popup.html      # ポップアップHTMLインターフェース
│   ├── popup.css       # ポップアップスタイル
│   └── popup.js        # ポップアップロジック
└── icons/              # アイコンリソース
    ├── icon16.png      # 16x16 アイコン
    ├── icon48.png      # 48x48 アイコン
    └── icon128.png     # 128x128 アイコン
```

## 3. 詳細設計

### 3.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "OutbrainBlocker",
  "version": "1.0.0",
  "description": "Outbrain社のブラウザバック広告をブロックし、快適なブラウジングを実現します",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "history",
    "tabs",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/detector.js", "content/blocker.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### 3.2 Background Script (background.js)

#### 3.2.1 主要機能
- ウェブリクエストの監視とフィルタリング
- コンテンツスクリプトとのメッセージング管理
- ステータスと設定の管理
- 統計データの収集と管理

#### 3.2.2 ドメインフィルタリング
以下のドメインからのリクエストをブロック:
- outbrain.com
- *.outbrain.com
- widgets.outbrain.com
- vra.outbrain.com
- vrp.outbrain.com
- vrt.outbrain.com
- mv.outbrain.com

#### 3.2.3 実装アルゴリズム

**初期化処理**:
```javascript
// 初期設定の読み込み
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
  
  // ウェブリクエストフィルタの設定
  setupWebRequestFiltering(enabled);
});
```

**ウェブリクエストフィルタリング**:
```javascript
function setupWebRequestFiltering(enabled) {
  if (enabled) {
    chrome.webRequest.onBeforeRequest.addListener(
      handleRequest,
      { urls: [
        "*://*.outbrain.com/*",
        "*://outbrain.com/*",
        "*://*.widgets.outbrain.com/*",
        "*://*.vra.outbrain.com/*",
        "*://*.vrp.outbrain.com/*",
        "*://*.vrt.outbrain.com/*",
        "*://*.mv.outbrain.com/*"
      ]},
      ["blocking"]
    );
  } else {
    // リスナーの削除
    chrome.webRequest.onBeforeRequest.removeListener(handleRequest);
  }
}

function handleRequest(details) {
  // リクエストがブロックされたカウントを増加
  chrome.storage.sync.get(['blockedCount'], function(data) {
    const newCount = (data.blockedCount || 0) + 1;
    chrome.storage.sync.set({ blockedCount: newCount });
  });
  
  // リクエストをブロック
  return { cancel: true };
}
```

### 3.3 Content Scripts

#### 3.3.1 detector.js

**History API監視の実装**:
```javascript
(function() {
  // オリジナルのHistory APIメソッドを保存
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // History.pushStateのオーバーライド
  history.pushState = function(state, title, url) {
    // Outbrain広告の挿入パターンを検出
    if (isOutbrainAdInsertion(url)) {
      // 広告挿入を検出した場合、バックグラウンドスクリプトに通知
      chrome.runtime.sendMessage({
        action: "outbrainDetected",
        url: url,
        method: "pushState"
      });
      
      // 元のpushStateを呼び出さないことで、広告ページの挿入をブロック
      return;
    }
    
    // 通常の操作の場合は元のメソッドを呼び出す
    return originalPushState.apply(this, arguments);
  };
  
  // History.replaceStateのオーバーライド
  history.replaceState = function(state, title, url) {
    // Outbrain広告の挿入パターンを検出
    if (isOutbrainAdInsertion(url)) {
      // 広告挿入を検出した場合、バックグラウンドスクリプトに通知
      chrome.runtime.sendMessage({
        action: "outbrainDetected",
        url: url,
        method: "replaceState"
      });
      
      // 元のreplaceStateを呼び出さないことで、広告ページの挿入をブロック
      return;
    }
    
    // 通常の操作の場合は元のメソッドを呼び出す
    return originalReplaceState.apply(this, arguments);
  };
  
  // Outbrain広告挿入の検出ロジック
  function isOutbrainAdInsertion(url) {
    // URLにOutbrain関連パターンが含まれているか確認
    if (url && (
        url.includes('outbrain.com') || 
        url.includes('ob_click') || 
        url.includes('sponsored') ||
        // Outbrain広告ページに特徴的なパラメータパターン
        url.includes('obOrigUrl') ||
        url.includes('obClickId')
      )) {
      return true;
    }
    
    // ページ内にOutbrain広告の特徴的な要素が存在するか確認
    const outbrainElements = document.querySelectorAll('[data-obct], [data-ob-src], [data-widget-id*="outbrain"]');
    return outbrainElements.length > 0;
  }
})();
```

#### 3.3.2 blocker.js

**広告ブロック処理の実装**:
```javascript
(function() {
  // Outbrain関連スクリプトのブロック
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(function(node) {
          // スクリプト要素の場合
          if (node.tagName === 'SCRIPT') {
            // Outbrain関連スクリプトかチェック
            if (node.src && (
                node.src.includes('outbrain.com') ||
                node.src.includes('widgets.outbrain.com')
              )) {
              // スクリプトの読み込みを防止
              node.type = 'javascript/blocked';
              node.parentNode.removeChild(node);
              
              // ブロックしたことを報告
              chrome.runtime.sendMessage({
                action: "scriptBlocked",
                src: node.src
              });
            }
          }
          
          // Outbrain広告コンテナの場合
          if (node.nodeType === 1 && (
              node.classList.contains('OUTBRAIN') ||
              node.id && node.id.includes('outbrain') ||
              node.hasAttribute('data-widget-id') && node.getAttribute('data-widget-id').includes('outbrain')
            )) {
            // 広告コンテナを削除
            node.parentNode.removeChild(node);
            
            // ブロックしたことを報告
            chrome.runtime.sendMessage({
              action: "containerBlocked"
            });
          }
        });
      }
    });
  });
  
  // DOMの変更を監視
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  
  // ページ読み込み完了時にOutbrain要素を検索して削除
  window.addEventListener('load', function() {
    // OutbrainコンテナをDOMから削除
    const outbrainContainers = document.querySelectorAll('.OUTBRAIN, [id*="outbrain"], [data-widget-id*="outbrain"]');
    outbrainContainers.forEach(function(container) {
      container.parentNode.removeChild(container);
      
      // ブロックしたことを報告
      chrome.runtime.sendMessage({
        action: "containerBlocked"
      });
    });
  });
})();
```

### 3.4 ポップアップUI (popup.html, popup.js)

#### 3.4.1 popup.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OutbrainBlocker</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>OutbrainBlocker</h1>
    
    <div class="toggle-container">
      <label class="switch">
        <input type="checkbox" id="enableToggle">
        <span class="slider round"></span>
      </label>
      <span id="statusText">有効</span>
    </div>
    
    <div class="stats-container">
      <h2>統計情報</h2>
      <p>ブロックした広告: <span id="blockedCount">0</span></p>
    </div>
    
    <div class="site-settings">
      <h2>現在のサイト設定</h2>
      <div class="current-site">
        <span id="currentSite">loading...</span>
        <label class="switch">
          <input type="checkbox" id="siteToggle">
          <span class="slider round"></span>
        </label>
      </div>
    </div>
    
    <div class="footer">
      <button id="resetStats">統計リセット</button>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

#### 3.4.2 popup.js
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const enableToggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const blockedCount = document.getElementById('blockedCount');
  const currentSite = document.getElementById('currentSite');
  const siteToggle = document.getElementById('siteToggle');
  const resetStats = document.getElementById('resetStats');
  
  // 現在のタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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
    });
  });
  
  // サイト固有のトグル
  siteToggle.addEventListener('change', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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
        });
      });
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
```

## 4. 動作仕様

### 4.1 History API操作の検出と処理

1. ページ読み込み時にContent Script（detector.js）がhistory.pushStateとhistory.replaceStateをオーバーライド
2. 広告挿入を検出した場合:
   - 操作をブロックし、元のメソッドを呼び出さない
   - バックグラウンドスクリプトに通知

### 4.2 リソースブロック処理

1. バックグラウンドスクリプトがOutbrain関連ドメインからのリクエストを監視
2. 該当リクエストを検出した場合:
   - リクエストをキャンセル
   - ブロックカウントを増加
   - アイコンにブロック状態を表示

### 4.3 DOM操作によるブロック

1. blocker.jsがDOMの変更を監視
2. Outbrain関連の要素が追加された場合:
   - 要素を削除
   - スクリプトの場合はtype属性を変更して実行を防止
   - バックグラウンドスクリプトに通知

### 4.4 設定管理

1. 拡張機能の有効/無効設定:
   - ポップアップUIから切り替え可能
   - chrome.storage.syncに保存
   - バックグラウンドスクリプトがリアルタイムに反映

2. サイト固有の設定:
   - ドメイン単位で有効/無効を設定可能
   - chrome.storage.syncに保存
   - Content Scriptが現在のドメインの設定に基づいて動作

## 5. エラーハンドリング

### 5.1 History API監視の例外処理

```javascript
try {
  // History APIのオーバーライド処理
} catch (e) {
  // エラーログの送信
  chrome.runtime.sendMessage({
    action: "error",
    error: "History API監視でエラーが発生しました: " + e.message,
    stack: e.stack
  });
  
  // オリジナルのメソッドを使用
  history.pushState = originalPushState;
  history.replaceState = originalReplaceState;
}
```

### 5.2 バックグラウンドスクリプトの接続エラー処理

```javascript
// メッセージ送信時のエラー処理
chrome.runtime.sendMessage({ /* メッセージ内容 */ }, function(response) {
  if (chrome.runtime.lastError) {
    console.error("バックグラウンドスクリプトへの通信エラー: ", chrome.runtime.lastError.message);
    
    // 再接続ロジック
    setTimeout(function() {
      chrome.runtime.sendMessage({ /* 再送信 */ });
    }, 1000);
  }
});
```

## 6. パフォーマンス最適化

### 6.1 リソース使用量削減

- Content Scriptのサイズを最小限に保つ
- 必要最小限のDOM監視
- ページの状態変化に応じた処理の最適化

### 6.2 監視処理の最適化

```javascript
// より効率的なDOMの変更監視
const observerOptions = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
};

// 特定のノードタイプのみ処理
function filterNodes(nodes) {
  return Array.from(nodes).filter(node => {
    return node.nodeType === 1 && ( // 要素ノードのみ
      node.tagName === 'SCRIPT' ||
      node.tagName === 'DIV' ||
      node.tagName === 'IFRAME'
    );
  });
}
```

## 7. テスト仕様

### 7.1 テスト環境

- **ブラウザ**: Chrome 最新安定版, Chrome Beta, Chrome Dev
- **OS**: Windows 10/11, macOS, Ubuntu Linux
- **接続環境**: 高速回線、低速回線

### 7.2 機能テスト項目

| テストID | テスト内容 | 期待結果 |
|----------|------------|----------|
| T-01 | 拡張機能のインストール | 正常にインストールされ、デフォルト設定で有効化される |
| T-02 | Impressサイトでのブラウザバック操作 | ブラウザバック広告が表示されず、正常に前のページに戻る |
| T-03 | 拡張機能の有効/無効切り替え | トグルスイッチにより機能がON/OFFされる |
| T-04 | サイト固有の設定 | 特定サイトでのみ有効/無効設定が反映される |
| T-05 | ブロック統計の表示 | ブロックした広告数が正確にカウントされ表示される |
| T-06 | 統計リセット | ブロックカウントが0にリセットされる |
| T-07 | ページ遷移での挙動 | 複数ページ間の移動時に正常に機能する |
| T-08 | 複数タブでの動作 | 複数タブを開いた状態でも各タブごとに正常に機能する |

### 7.3 パフォーマンステスト

- ページ読み込み時間への影響測定
- メモリ使用量のモニタリング
- CPU使用率の計測

## 8. 配布とアップデート計画

### 8.1 Chrome Web Storeへの公開

1. 拡張機能パッケージの作成
2. Chrome Web Storeへの提出
3. プライバシーポリシーの作成と公開

### 8.2 バージョン管理計画

| バージョン | 内容 | 予定リリース日 |
|------------|------|----------------|
| 1.0.0 | 初期リリース - 基本ブロック機能 | 初回リリース |
| 1.1.0 | 統計機能の強化、UI改善 | 初回リリース後1ヶ月 |
| 1.2.0 | サイト別設定の詳細化、ブロックパターンの追加 | 初回リリース後2ヶ月 |
| 2.0.0 | 他の広告プロバイダー（Taboola等）への対応追加 | 初回リリース後3ヶ月 |

### 8.3 メンテナンス計画

- 2週間ごとのブロックパターン更新
- ユーザーフィードバックに基づく改善
- Chrome APIの変更に応じた対応

## 9. セキュリティ配慮事項

### 9.1 パーミッション最小化

- 必要最小限のパーミッションのみ要求
- 特に機密データにアクセスしない設計

### 9.2 コード安全性

- 入力値の適切なバリデーション
- クロスサイトスクリプティング対策
- Content Security Policyの適用

```json
// manifest.jsonに追加
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### 9.3 データ管理

- ユーザーデータの収集は最小限
- 収集したデータは端末内のみに保存
- 外部サーバーとの通信なし

## 10. プロジェクト管理

### 10.1 開発フェーズ

| フェーズ | 内容 | 期間 |
|----------|------|------|
| フェーズ1 | 基本機能の実装 | 2週間 |
| フェーズ2 | UI実装とテスト | 1週間 |
| フェーズ3 | パフォーマンス最適化 | 1週間 |
| フェーズ4 | リリース準備とドキュメント | 1週間 |

### 10.2 リソース計画

- **開発者**: 1名（フルタイム）
- **テスター**: 1名（パートタイム）
- **デザイナー**: 1名（アイコンとUI）

## 付録: 技術参考資料

- [Chrome Extension API ドキュメント](https://developer.chrome.com/docs/extensions/)
- [History API - MDN Web Docs](https://developer.mozilla.org/ja/docs/Web/API/History_API)
- [Chrome Manifest V3 移行ガイド](https://developer.chrome.com/docs/extensions/mv3/intro/)