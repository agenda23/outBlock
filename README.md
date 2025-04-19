# OutBlocker - O社ブラウザバック広告ブロック拡張機能

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

OutBlockerは、O社が提供するブラウザバック広告（「戻る」ボタンを押した際に表示される広告）をブロックするためのGoogle Chrome拡張機能です。ユーザーのブラウジング体験を向上させることを目的としています。

## 機能

- **History API監視**: O社広告の挿入を検出し、ブロックします
- **リソースブロック**: O社関連ドメインからのリソース読み込みをブロックします
- **DOM要素削除**: ページ内のO社広告要素を自動的に削除します
- **設定のカスタマイズ**:
  - 拡張機能の有効/無効を切り替え可能
  - サイト単位での設定が可能
  - ブロック統計を確認可能

## インストール方法

### Chrome Webストアからインストール
- Chrome Webストアからインストール（公開後にリンクを追加予定）

### 開発者モードでのインストール
1. このリポジトリをクローンまたはダウンロードします
2. Chromeで `chrome://extensions` を開きます
3. 「デベロッパーモード」を有効にします
4. 「パッケージ化されていない拡張機能を読み込む」をクリックします
5. ダウンロードしたフォルダを選択します

## 使い方

1. 拡張機能をインストールすると、自動的に有効化されます
2. ブラウザの右上に表示される拡張機能アイコンをクリックすると、設定画面が開きます
3. 設定画面では以下の操作が可能です:
   - 拡張機能全体の有効/無効の切り替え
   - 現在閲覧中のサイトでの拡張機能の有効/無効の切り替え
   - ブロックした広告数の確認
   - 統計情報のリセット

## 技術的な仕組み

この拡張機能は以下の手法を使用してO社のブラウザバック広告をブロックします：

1. **History API監視**: 
   - `history.pushState`と`history.replaceState`メソッドをオーバーライドして、不正な操作を検出・ブロックします

2. **リソースブロック**:
   - O社関連ドメインからのリクエストをブロックします

3. **DOM要素の監視と削除**:
   - MutationObserverを使用してDOM変更を監視し、O社関連の要素が追加された場合に削除します

## プライバシーポリシー

この拡張機能は、ユーザーのプライバシーを尊重するように設計されています。収集する情報は最小限に抑え、外部サーバーへのデータ送信は行いません。詳細については、[プライバシーポリシー](privacy_policy.html)をご覧ください。

## 開発

### ディレクトリ構造

```
OutBlocker/
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

### 必要な権限

- `webRequest`: ウェブリクエストの監視
- `history`: ブラウザ履歴の操作
- `tabs`: 現在のタブ情報へのアクセス
- `storage`: 設定の保存

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細については[LICENSE](LICENSE)ファイルをご覧ください。

## 作者

- agenda23 (agenda23@gmail.com)

## 貢献

バグ報告や機能リクエストは、Issuesセクションでお知らせください。プルリクエストも歓迎します。

## 参考資料

- [「ブラウザの履歴を操作して「戻る」ボタンで広告を出すやつについて」](https://blog.maripo.org/2024/08/history-api-abuse/) - blog.maripo.org
- [History API - MDN Web Docs](https://developer.mozilla.org/ja/docs/Web/API/History_API)
- [Chrome Extensions API リファレンス](https://developer.chrome.com/docs/extensions/reference/)
