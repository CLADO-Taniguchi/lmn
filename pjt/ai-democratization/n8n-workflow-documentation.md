
# n8n チャット対応ワークフロー設計書

## 概要

**ファイル名**: `lmn_n8n_chat.json`  
**バージョン**: Chat対応版 v1.0  
**インスタンスID**: `redshift-q-integration-chat-v1`  
**作成日**: 2025年1月13日

## ワークフローの目的

従来の単発クエリ形式から **チャット形式のデータ分析** に対応するため、以下の機能を実装：

- 📝 **会話履歴の管理**: 前の質問・回答を記憶
- 🔄 **コンテキスト考慮**: 過去の会話を踏まえた回答生成
- 💬 **自然な対話**: より自然な会話体験の実現
- 🎯 **継続的分析**: 段階的な深堀り分析に対応

## ノード構成 (8ノード)

### 1. 🎯 チャットクエリ受信 (webhook-input)
- **タイプ**: `n8n-nodes-base.webhook`
- **パス**: `/ask-data`
- **メソッド**: POST
- **WebhookID**: `chat-query-jp`

**機能**:
- フロントエンドからのチャットメッセージを受信
- セッションID、会話履歴を含むペイロードを処理

**受信データ形式**:
```json
{
  "query": "ユーザーの質問",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "sessionId": "user-session-12345",
  "conversationHistory": [
    {
      "query": "前の質問",
      "response": "前の回答",
      "timestamp": "2025-01-13T11:55:00.000Z",
      "queryType": "count"
    }
  ]
}
```

### 2. 🧠 セッション管理 (session-management)
- **タイプ**: `n8n-nodes-base.code`
- **言語**: JavaScript

**機能**:
- セッションIDの管理・生成
- 会話履歴の初期化・検証
- コンテキストプロンプトの構築

**コンテキスト構築ロジック**:
```javascript
// 前の質問からのコンテキストを構築
let contextPrompt = '';
if (conversationHistory.length > 0) {
  contextPrompt = '\n\n前の会話履歴:\n';
  conversationHistory.slice(-3).forEach((item, index) => {
    contextPrompt += `${index + 1}. ユーザー: ${item.query}\n   システム: ${item.response}\n`;
  });
  contextPrompt += '\n上記の会話履歴を考慮して、以下の質問に答えてください。\n';
}
```

**出力データ**:
- sessionId
- currentQuery
- timestamp
- conversationHistory
- contextPrompt

### 3. 🌐 コンテキスト考慮翻訳 (translate-query)
- **タイプ**: `n8n-nodes-base.openAi`
- **モデル**: GPT-4
- **Temperature**: 0.2

**機能**:
- 日本語クエリを英語に翻訳
- 会話履歴を考慮した文脈理解
- 継続的な質問への対応

**プロンプト設計**:
```
以下の日本語のデータベース問い合わせを、Amazon Redshift Query Editor用の自然な英語に翻訳してください。
データベースのテーブル名やカラム名は変更しないでください。

{contextPrompt}

現在の日本語クエリ: {currentQuery}

英語クエリ:
```

### 4. 🔨 Amazon Q チャット対応SQL生成 (amazon-q-chat-simulation)
- **タイプ**: `n8n-nodes-base.code`
- **言語**: JavaScript

**機能**:
- 会話履歴を考慮したSQL生成
- クエリタイプの分類・管理
- 継続的質問への対応

**対応クエリタイプ**:
- `count`: レコード数取得
- `ranking`: ランキング系クエリ
- `temporal`: 時系列分析
- `detail`: 詳細情報要求
- `sample`: サンプルデータ表示

**継続性対応**:
```javascript
// 前の質問からのコンテキストを分析
const hasRecentCount = conversationHistory.some(item => 
  item.query.includes('数') || item.query.includes('count') || item.query.includes('件数')
);

// 詳細要求への対応
if (originalQuery.includes('詳細') || originalQuery.includes('もっと')) {
  // 前の質問の詳細を求められた場合の処理
}
```

### 5. 🗄️ Redshift SQL実行 (redshift-execute)
- **タイプ**: `n8n-nodes-base.postgres`
- **操作**: executeQuery
- **クレデンシャル**: `redshift-db-credentials`

**機能**:
- 生成されたSQLクエリをRedshiftで実行
- 結果データの取得・整形
- エラーハンドリング

### 6. 📝 チャット形式結果説明 (result-explanation)
- **タイプ**: `n8n-nodes-base.openAi`
- **モデル**: GPT-4
- **Temperature**: 0.3

**機能**:
- SQL実行結果の日本語説明生成
- 会話の流れを考慮した自然な回答
- 非技術者向けの分かりやすい説明

**プロンプト設計**:
```
以下のSQLクエリ実行結果を、非技術者にもわかりやすい日本語で説明してください。
会話の流れを考慮した自然な回答をお願いします。

会話の流れ: {conversationHistory}
現在の質問: {originalQuery}
実行したSQL: {generatedSql}
実行結果: {results}

分かりやすい説明:
```

### 7. 📚 会話履歴更新 (history-update)
- **タイプ**: `n8n-nodes-base.code`
- **言語**: JavaScript

**機能**:
- 会話履歴の更新・管理
- 最新10件の会話を保持
- セッション情報の維持

**履歴管理ロジック**:
```javascript
// 新しい会話エントリを追加
const newHistoryEntry = {
  query: currentQuery,
  response: explanation,
  timestamp: new Date().toISOString(),
  queryType: queryType
};

// 会話履歴を更新（最新10件まで保持）
const updatedHistory = [...conversationHistory, newHistoryEntry].slice(-10);
```

### 8. 📤 チャットレスポンス返却 (response-output)
- **タイプ**: `n8n-nodes-base.respondToWebhook`
- **形式**: JSON

**機能**:
- 最終レスポンスの整形・返却
- フロントエンドへの統一形式でのデータ送信

**レスポンス形式**:
```json
{
  "sessionId": "user-session-12345",
  "success": true,
  "original_query": "ユーザーの質問",
  "english_query": "Translated English query",
  "generated_sql": "SELECT ...",
  "results": [...],
  "explanation": "分かりやすい日本語説明",
  "confidence": 0.95,
  "timestamp": "2025-01-13T12:00:00.000Z",
  "conversationHistory": [...],
  "queryType": "count"
}
```

## データフロー

```
チャットクエリ受信 
↓
セッション管理 (履歴・コンテキスト構築)
↓
コンテキスト考慮翻訳 (日本語→英語)
↓
Amazon Q チャット対応SQL生成 (SQL生成)
↓
Redshift SQL実行 (クエリ実行)
↓
チャット形式結果説明 (結果の日本語化)
↓
会話履歴更新 (履歴保存)
↓
チャットレスポンス返却 (フロントエンドへ送信)
```

## 従来版との違い

| 項目 | 従来版 | チャット対応版 |
|------|---------|---------------|
| **会話管理** | 単発のみ | セッション・履歴管理 |
| **コンテキスト** | なし | 前の会話を考慮 |
| **継続性** | 各質問が独立 | 段階的深堀り可能 |
| **ノード数** | 6ノード | 8ノード |
| **SQL生成** | 単純なパターンマッチ | 履歴考慮型生成 |
| **説明生成** | 個別説明 | 会話流れ考慮説明 |

## 実装上の工夫

### 🔄 会話継続性の実現
- 最新3件の会話履歴をコンテキストプロンプトに含める
- "詳細"、"もっと"などの継続キーワードを検出
- クエリタイプに基づく適切なSQL生成

### 🧠 メモリ管理
- 会話履歴は最新10件まで保持（メモリ効率化）
- セッションIDによる会話の分離
- タイムスタンプによる時系列管理

### 🎯 クエリタイプ分類
- `count`: 数量系クエリ
- `ranking`: ランキング系クエリ  
- `temporal`: 時系列系クエリ
- `detail`: 詳細要求
- `sample`: サンプル表示

## 設定要件

### 必要なクレデンシャル
1. **OpenAI API Key** (`openai-api-key`)
   - GPT-4アクセス権限
   - 翻訳・説明生成に使用

2. **Redshift Database Credentials** (`redshift-db-credentials`)
   - PostgreSQL接続設定
   - Redshiftクラスターへの接続情報

### 環境変数
- Webhook URL: `https://your-n8n-instance.com/webhook/ask-data`
- セッション管理: 実装では外部ストレージ（Redis等）推奨

## テスト用サンプルクエリ

### 初回質問
```json
{
  "query": "2024年の売上実績を教えて",
  "sessionId": "test-session-001",
  "conversationHistory": []
}
```

### 継続質問
```json
{
  "query": "その詳細を都道府県別で見せて",
  "sessionId": "test-session-001",
  "conversationHistory": [
    {
      "query": "2024年の売上実績を教えて",
      "response": "2024年の売上実績を取得しました...",
      "timestamp": "2025-01-13T12:00:00.000Z",
      "queryType": "temporal"
    }
  ]
}
```

## 今後の拡張予定

1. **外部ストレージ連携**: Redis/DynamoDBでの永続的セッション管理
2. **マルチユーザー対応**: ユーザーIDベースのセッション分離
3. **高度な分析**: より複雑なSQL生成とチャート生成
4. **リアルタイム通知**: 長時間クエリの進捗通知
5. **エクスポート機能**: 会話履歴・結果のエクスポート

---

**最終更新**: 2025年1月13日  
**担当者**: Lumine Data Intelligence Platform開発チーム 

## トラブルシューティング

### Claude APIレスポンスサイズ制限問題

**問題**: Redshift SQL実行ノードで`{{ $('Code').item.json.content[0].text }}`を使用する際、Claudeから受け取ったテキスト情報が配列に対して大きすぎると原因不明のエラーが発生する。

**症状**:
- n8nワークフローが途中で停止する
- 明確なエラーメッセージが表示されない
- 大きなSQLクエリや長いレスポンスで発生しやすい

**原因**:
- Claude APIからの大量のテキストレスポンス
- n8nの内部配列処理制限
- PostgreSQL/Redshiftノードでの入力サイズ制限

**対策**:
1. **レスポンス長制限**: Claude APIへのmax_tokensパラメータを適切に設定
2. **テキスト分割**: 長いSQLクエリは複数に分割して実行
3. **エスケープ処理**: 特殊文字や改行の適切な処理（Codeノードで実装済み）
4. **デバッグモード**: 各ノードでのデータサイズを監視

**推奨設定**:
```json
{
  "max_tokens": 500,  // 長すぎるレスポンスを防ぐ
  "temperature": 0.2   // 一貫性のある短い回答を促進
}
```

**注意**: この問題は前回の重要な仕様議論で特定されたため、本番環境では必ず考慮すること。

### n8n Cloud Webhook URL設定問題

**問題**: フロントエンドのAPIルートが`localhost:5678`を参照しているため、n8n Cloudインスタンスに接続できない。

**症状**:
- CLIからの直接テスト: ✅ 成功
- フロントエンドからのアクセス: ❌ 404エラー

**対策**:
1. n8n Cloud管理画面からWebhook URLを確認
2. APIルート(`app/api/n8n-webhook/route.ts`)のデフォルトURLを修正
3. 環境変数`N8N_WEBHOOK_URL`に正しいCloud URLを設定

**設定例**:
```typescript
// 正しい設定（TEST URLを使用）
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://clado.app.n8n.cloud/webhook-test/simple-test-20250714';
```

**重要な注意点**:
- n8nのバグのため、Production URLは機能しない
- 必ずTest URLを使用すること
- URL形式: `https://[instance].app.n8n.cloud/webhook-test/[path]` 

## 2025年1月15日 作業ログ - SQLプロンプト修正とDB構造問題

### 発見された問題

1. **Claude APIプロンプトの問題**
   - 存在しないテーブル（`datamart.members`）を参照してSQLを生成
   - 実際のテーブルは `datamart.aas_summary`
   - 存在しないカラム（`prefecture`）を使用（実際のカラム名は未確認）

2. **SQLエスケープ処理の問題**
   - Codeノードが過剰にエスケープ処理を実行
   - 例: `WHERE prefecture = '香川県'` → `WHERE prefecture = \香川県\県\\`
   - SQL構文エラーの原因となっていた

3. **環境変数の問題**
   - Production URL (`https://clado.app.n8n.cloud/webhook/ask-data`) が404エラー
   - Test URL (`https://clado.app.n8n.cloud/webhook-test/simple-test-20250714`) に変更で解決

### 実施した修正

1. **環境変数の修正**
   ```bash
   # .env.localファイルを作成
   N8N_WEBHOOK_URL=https://clado.app.n8n.cloud/webhook-test/simple-test-20250714
   ```

2. **Claude APIプロンプトの修正案**
   ```json
   {
     "model": "claude-3-5-sonnet-20241022",
     "max_tokens": 200 //配列のデータ量が多いと配列が破綻して原因不明のエラーになるため上限を設定,
     "messages": [
       {
         "role": "user",
         "content": "以下の日本語クエリを、利用可能なデータベーステーブル datamart.aas_summary を参照してSQLに変換してください。このテーブルにはprefecture（都道府県）、date（日付）、sales（売上）、category（カテゴリ）などの列が含まれています。コードブロックは使わず、SQLのみ返してください: {{ $('Webhook').item.json.body.query }}"
       }
     ]
   }
   ```

3. **Codeノードのエスケープ処理修正案**
   ```javascript
   // エスケープ処理を削除した版
   function cleanClaudeResponse(str) {
     if (typeof str !== 'string') return str;
     return str
       .replace(/\n/g, ' ')           // 改行をスペースに置換
       .replace(/\r/g, '')            // キャリッジリターンを削除
       .replace(/\s+/g, ' ')          // 連続するスペースを1つに
       .trim();                       // 前後の空白を削除
   }
   ```

### 根本的な設計問題

**現在のアーキテクチャの限界**：
- Claude APIがデータベース構造を把握していない状態でSQLを生成
- プロンプトに仮定のカラム名を含めている（実際と異なる可能性）
- 業務で複数のテーブルを扱う場合に対応できない

### 今後の検討事項

1. **データベーススキーマ管理の実装**
   - `db_schema.yml`ファイルを作成（全テーブル定義）
   - n8nワークフローにスキーマ読み込みノードを追加
   - Claude APIに完全なDB構造を提供

2. **推奨されるワークフロー改善**
   ```
   Webhook → Schema File読込 → Claude API（全DB構造付き） → SQL生成 → 実行
   ```

3. **代替アプローチの検討**
   - ベクトルDBを使用した関連テーブル自動検出
   - メタデータAPIの構築
   - 動的スキーマ取得とキャッシング
   - セマンティックマッピングの実装

4. **実際のテーブル構造の確認**
   - `datamart.aas_summary`の正確なカラム名を確認する必要あり
   - `DESCRIBE datamart.aas_summary`または`SELECT * FROM datamart.aas_summary LIMIT 1`の実行

5. **エラーハンドリングの改善**
   - 空のレスポンス処理
   - SQL実行エラーの詳細表示
   - ユーザーフレンドリーなエラーメッセージ

### 次のステップ

1. 実際のDB構造を確認
2. db_schema.ymlファイルの完成
3. n8nワークフローへのスキーマ読み込みノード追加
4. Claude APIプロンプトの全面改訂
5. エンドツーエンドのテスト実行

**注意**: 現在の実装はPoCレベルであり、本番環境では以下が必要：
- 適切なDB構造管理
- セキュリティ対策（SQLインジェクション防止）
- エラーハンドリングの強化
- パフォーマンス最適化 