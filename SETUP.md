# Google スプレッドシート同期 セットアップ手順

このアプリは Google スプレッドシートをバックエンドとして使用します。
以下の手順で初期設定を行ってください(初回のみ、所要 5〜10 分)。

---

## 1. スプレッドシートを作成

1. [Google スプレッドシート](https://sheets.google.com/) を開く
2. 新しい空のシートを作成(名前は何でも OK、例: 「生徒会タイムカード」)
3. URL から **シートID** をメモする
   - URL 例: `https://docs.google.com/spreadsheets/d/1AbCdEf...XyZ/edit`
   - 太字部分(`/d/` と `/edit` の間)が シートID

> シート内のタブ「メンバー」「打刻記録」は、初回起動時にアプリが自動作成します。

---

## 2. Google Cloud Console でサービスアカウントを作る

### 2-1. プロジェクトを作る(or 既存プロジェクトを使う)
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクト選択 → 「新しいプロジェクト」
3. 名前は何でも OK(例: `seitokai-timecard`)→ 作成

### 2-2. Google Sheets API を有効化
1. 左メニュー「APIとサービス」→「ライブラリ」
2. `Google Sheets API` を検索 → 「有効にする」

### 2-3. サービスアカウントを作成
1. 左メニュー「APIとサービス」→「認証情報」
2. 上部「+ 認証情報を作成」→「サービスアカウント」
3. サービスアカウント名(例: `timecard-server`)→ 「作成して続行」
4. ロールはなしで OK(スプレッドシート側で個別共有するため)→「完了」

### 2-4. JSON キーをダウンロード
1. 「認証情報」画面に戻る → 作成したサービスアカウントをクリック
2. 上部タブ「キー」→「鍵を追加」→「新しい鍵を作成」
3. キーのタイプ「JSON」→ 「作成」
4. JSON ファイルがダウンロードされる
5. ファイル名を `credentials.json` にリネーム
6. プロジェクトの `server/credentials.json` に置く
   - 場所: `c:\開発ファイル\timecard\server\credentials.json`

> **重要**: この JSON ファイルは絶対に Git に上げない・他人に渡さないこと。
> `.gitignore` で除外済み。

---

## 3. スプレッドシートをサービスアカウントと共有

1. ダウンロードした `credentials.json` を開いて `client_email` をコピー
   - 例: `timecard-server@your-project.iam.gserviceaccount.com`
2. ステップ 1 で作ったスプレッドシートを開く
3. 右上「共有」→ 上のメールアドレスを貼り付け
4. 権限を「**編集者**」にする
5. 「通知しない」のチェックは入れたままで OK → 「共有」

---

## 4. .env ファイルを作る

プロジェクトルートに `.env` を作成:

```
GOOGLE_SHEET_ID=ここにステップ1でコピーしたシートIDを貼る
```

例:
```
GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

## 5. 動作確認

```
npm run dev
```

正常に起動すると以下のログが出ます:

```
[server] Google Sheets connected
[server] storage API listening on http://localhost:3001
```

ブラウザで http://localhost:5173/ を開いて、メンバーを 1 人追加してみてください。
スプレッドシートを開くと「メンバー」タブにすぐ反映されます。

逆にスプレッドシートで直接編集しても、15 秒以内にアプリ側に反映されます。

---

## トラブルシューティング

### `Failed to initialize Sheets: GOOGLE_SHEET_ID is not set in .env`
→ `.env` ファイルが無いか、`GOOGLE_SHEET_ID` の値が空。

### `Service account credentials not found at ...`
→ `server/credentials.json` が無い。ステップ 2-4 をやり直し。

### `The caller does not have permission` / 403
→ スプレッドシートをサービスアカウントと共有していない。ステップ 3 をやり直し。

### `Requested entity was not found` / 404
→ `GOOGLE_SHEET_ID` が間違っている。URL から再コピー。
