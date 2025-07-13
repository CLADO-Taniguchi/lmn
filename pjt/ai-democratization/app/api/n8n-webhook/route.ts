import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // n8nワークフローのWebhook URL（環境変数から取得）
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ask-data';
    
    // n8nワークフローに送信するデータ形式
    const n8nPayload = {
      query: body.query,
      timestamp: body.timestamp || new Date().toISOString()
    };

    // n8nワークフローへのリクエスト
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status}`);
    }

    const data = await response.json();
    
    // レスポンスデータを整形
    const formattedResponse = {
      success: data.success || true,
      original_query: data.original_query || body.query,
      english_query: data.english_query || '',
      generated_sql: data.generated_sql || '',
      results: data.results || [],
      explanation: data.explanation || 'データを分析しました。',
      confidence: data.confidence || 0.95,
      timestamp: data.timestamp || new Date().toISOString()
    };

    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    console.error('API Route Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'データの処理中にエラーが発生しました。',
        explanation: 'すみません、現在サービスに接続できません。しばらく時間をおいて再度お試しください。'
      }, 
      { status: 500 }
    );
  }
} 