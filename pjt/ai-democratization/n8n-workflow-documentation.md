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