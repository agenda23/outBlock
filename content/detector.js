(function() {
  // サイト設定を取得
  let isEnabled = true; // デフォルトは有効

  // バックグラウンドスクリプトから現在のサイト設定を取得
  chrome.runtime.sendMessage({ action: 'getSiteSettings' }, function(response) {
    if (response && response.enabled !== undefined) {
      isEnabled = response.enabled;
    }
    
    // 設定が有効な場合のみ監視を開始
    if (isEnabled) {
      setupHistoryAPIMonitoring();
    }
  });

  // History API監視の設定
  function setupHistoryAPIMonitoring() {
    try {
      // オリジナルのHistory APIメソッドを保存
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      // History.pushStateのオーバーライド
      history.pushState = function(state, title, url) {
        // O社広告の挿入パターンを検出
        if (isOutbrainAdInsertion(url)) {
          // 広告挿入を検出した場合、バックグラウンドスクリプトに通知
          chrome.runtime.sendMessage({
            action: "outbrainDetected",
            url: url,
            method: "pushState"
          });
          
          console.log("O社広告の挿入をブロックしました (pushState):", url);
          
          // 元のpushStateを呼び出さないことで、広告ページの挿入をブロック
          return;
        }
        
        // 通常の操作の場合は元のメソッドを呼び出す
        return originalPushState.apply(this, arguments);
      };
      
      // History.replaceStateのオーバーライド
      history.replaceState = function(state, title, url) {
        // O社広告の挿入パターンを検出
        if (isOutbrainAdInsertion(url)) {
          // 広告挿入を検出した場合、バックグラウンドスクリプトに通知
          chrome.runtime.sendMessage({
            action: "outbrainDetected",
            url: url,
            method: "replaceState"
          });
          
          console.log("O社広告の挿入をブロックしました (replaceState):", url);
          
          // 元のreplaceStateを呼び出さないことで、広告ページの挿入をブロック
          return;
        }
        
        // 通常の操作の場合は元のメソッドを呼び出す
        return originalReplaceState.apply(this, arguments);
      };
      
      // popstate イベントリスナーの追加（ブラウザバック操作の監視）
      window.addEventListener('popstate', function(event) {
        const currentUrl = window.location.href;
        
        // 現在のURLがO社広告かどうかをチェック
        if (isOutbrainAdInsertion(currentUrl)) {
          // 履歴から広告ページを削除
          console.log("O社広告ページからの復帰を検出しました:", currentUrl);
          
          // バックグラウンドスクリプトに通知
          chrome.runtime.sendMessage({
            action: "outbrainDetected",
            url: currentUrl,
            method: "popstate"
          });
          
          // ブラウザバックを再実行
          window.history.back();
        }
      });
      
      console.log("History API監視を設定しました");
    } catch (e) {
      // エラーログの送信
      chrome.runtime.sendMessage({
        action: "error",
        error: "History API監視でエラーが発生しました: " + e.message,
        stack: e.stack
      });
      
      console.error("History API監視の設定中にエラーが発生しました:", e);
    }
  }

  // O社広告挿入の検出ロジック
  function isOutbrainAdInsertion(url) {
    if (!url) return false;
    
    // URLにO社関連パターンが含まれているか確認
    if (
      url.includes('outbrain.com') || 
      url.includes('ob_click') || 
      url.includes('sponsored') ||
      url.includes('obOrigUrl') ||
      url.includes('obClickId') ||
      url.includes('recommend') ||
      /ob_[a-zA-Z0-9]+/.test(url)
    ) {
      return true;
    }
    
    // ページ内にO社広告の特徴的な要素が存在するか確認
    try {
      const outbrainElements = document.querySelectorAll(
        '[data-obct], [data-ob-src], [data-widget-id*="outbrain"], .OUTBRAIN, [id*="outbrain"]'
      );
      return outbrainElements.length > 0;
    } catch (e) {
      console.error("O社要素の検出中にエラーが発生しました:", e);
      return false;
    }
  }
})();