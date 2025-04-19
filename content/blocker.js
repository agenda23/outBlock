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
      setupDOMObserver();
      blockExistingElements();
    }
  });

  // DOM変更監視の設定
  function setupDOMObserver() {
    // O社関連スクリプトとDOMのブロック
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            processNode(node);
          });
        }
      });
    });
    
    // MutationObserverのオプション設定
    const observerOptions = {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    };
    
    // DOM変更の監視を開始
    observer.observe(document, observerOptions);
    console.log("DOM変更監視を開始しました");
  }

  // 既存のO社要素をブロック
  function blockExistingElements() {
    // ページ読み込み完了時にO社要素を検索して削除
    window.addEventListener('load', function() {
      // スクリプト要素をブロック
      const outbrainScripts = document.querySelectorAll('script[src*="outbrain.com"], script[src*="widgets.outbrain.com"]');
      outbrainScripts.forEach(function(script) {
        blockScript(script);
      });
      
      // OutbrainコンテナをDOMから削除
      const outbrainContainers = document.querySelectorAll(
        '.OUTBRAIN, [id*="outbrain"], [data-widget-id*="outbrain"], [data-ob-template], [data-ob-mark]'
      );
      outbrainContainers.forEach(function(container) {
        removeContainer(container);
      });
      
      console.log("既存のO社要素をブロックしました");
    });
  }

  // ノード処理
  function processNode(node) {
    // 要素ノードの場合のみ処理
    if (node.nodeType !== 1) return;
    
    // スクリプト要素の場合
    if (node.tagName === 'SCRIPT') {
      if (isOutbrainScript(node)) {
        blockScript(node);
      }
    }
    
    // O社広告コンテナの場合
    if (isOutbrainContainer(node)) {
      removeContainer(node);
    }
    
    // iframeの場合
    if (node.tagName === 'IFRAME') {
      if (isOutbrainIframe(node)) {
        removeContainer(node);
      }
    }
    
    // 子ノードも再帰的に処理
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach(function(childNode) {
        processNode(childNode);
      });
    }
  }

  // Outbrainスクリプトかどうかを判定
  function isOutbrainScript(node) {
    return node.src && (
      node.src.includes('outbrain.com') ||
      node.src.includes('widgets.outbrain.com') ||
      node.src.includes('vra.outbrain.com') ||
      node.src.includes('vrp.outbrain.com') ||
      node.src.includes('vrt.outbrain.com') ||
      node.src.includes('mv.outbrain.com')
    );
  }

  // Outbrainコンテナかどうかを判定
  function isOutbrainContainer(node) {
    return (
      (node.classList && node.classList.contains('OUTBRAIN')) ||
      (node.id && node.id.includes('outbrain')) ||
      (node.hasAttribute && node.hasAttribute('data-widget-id') && node.getAttribute('data-widget-id').includes('outbrain')) ||
      (node.hasAttribute && node.hasAttribute('data-ob-template')) ||
      (node.hasAttribute && node.hasAttribute('data-ob-mark')) ||
      (node.hasAttribute && node.hasAttribute('data-obct')) ||
      (node.hasAttribute && node.hasAttribute('data-ob-src'))
    );
  }

  // Outbrain iframeかどうかを判定
  function isOutbrainIframe(node) {
    return node.src && (
      node.src.includes('outbrain.com') ||
      node.src.includes('widgets.outbrain.com')
    );
  }

  // スクリプトのブロック
  function blockScript(script) {
    try {
      // スクリプトの読み込みを防止
      script.type = 'javascript/blocked';
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // ブロックしたことを報告
      chrome.runtime.sendMessage({
        action: "scriptBlocked",
        src: script.src
      });
      
      console.log("Outbrainスクリプトをブロックしました:", script.src);
    } catch (e) {
      console.error("スクリプトのブロック中にエラーが発生しました:", e);
    }
  }

  // コンテナの削除
  function removeContainer(container) {
    try {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      
      // ブロックしたことを報告
      chrome.runtime.sendMessage({
        action: "containerBlocked"
      });
      
      console.log("Outbrainコンテナを削除しました");
    } catch (e) {
      console.error("コンテナの削除中にエラーが発生しました:", e);
    }
  }
})();