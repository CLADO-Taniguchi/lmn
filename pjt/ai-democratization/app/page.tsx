
'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'こんにちは！Lumine Data Intelligence Platformへようこそ。データに関する質問を日本語でお聞かせください。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // セッション管理
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 会話履歴を構築（AIメッセージのみ）
      const conversationHistory = messages
        .filter(msg => msg.type === 'ai')
        .slice(-5) // 最新5件のAI応答のみ
        .map(msg => ({
          query: '', // 実際の実装では対応するユーザーメッセージを取得
          response: msg.content,
          timestamp: msg.timestamp.toISOString(),
          queryType: 'unknown'
        }));

      // n8nワークフローAPI呼び出し
      // 直接n8nにアクセス（CORS対応が必要）
      const n8nUrl = 'https://clado.app.n8n.cloud/webhook/simple-test-20250714';
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          timestamp: userMessage.timestamp.toISOString(),
          sessionId: currentSessionId, // 既存のセッションIDを送信（初回はnull）
          conversationHistory: conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // n8nワークフロー無効エラーの場合、詳細メッセージを表示
        if (errorData.error === 'n8nワークフローが無効です') {
          const aiMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `⚠️ ${errorData.explanation}\n\n💡 ${errorData.hint}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
          return;
        }
        
        // その他のエラーの場合
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `❌ エラー: ${errorData.error || 'API呼び出しに失敗しました'}\n\n${errorData.explanation || 'もう一度お試しください。'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      // n8nから直接レスポンスを受け取る場合
      const sessionId = currentSessionId || `session-${Date.now()}`;
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }
      
      // より詳細なレスポンスを表示
      let aiContent = data.explanation || 'データを分析しました。';
      
      // SQLクエリが生成された場合、追加情報を表示（n8nの形式に対応）
      if (data.claude_sql || data.generated_sql) {
        const sql = data.claude_sql || data.generated_sql;
        aiContent += `\n\n実行したクエリ:\n\`\`\`sql\n${sql}\n\`\`\``;
      }
      
      // 結果データがある場合、簡潔に表示（n8nの形式に対応）
      if (data.redshift_results || data.results) {
        const results = data.redshift_results || data.results;
        if (Array.isArray(results)) {
          aiContent += `\n\n結果: ${results.length}件のデータを取得しました。`;
        } else if (typeof results === 'object') {
          // オブジェクトの場合、JSONとして表示
          aiContent += `\n\n結果:\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\``;
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
  };

  const sampleQueries = [
    '今年の売上実績',
    '都道府県別集計',
    '香川県データ',
    '最新データ',
    '地域分布',
    'ブランド別売上',
    '月次トレンド',
    '顧客分析'
  ];

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Luxury%20high-end%20fashion%20boutique%20interior%20with%20modern%20minimalist%20design%2C%20premium%20clothing%20displays%2C%20elegant%20lighting%2C%20marble%20floors%2C%20sophisticated%20retail%20environment%2C%20clean%20white%20and%20blue%20color%20scheme%2C%20professional%20commercial%20space%20with%20designer%20garments%20on%20display%20racks%2C%20contemporary%20luxury%20shopping%20atmosphere&width=1920&height=1080&seq=lumine-bg-001&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-blue-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://static.readdy.ai/image/60a7852ea0ff95e4321c1f6f322cd6f8/33f7c24daa878e3690d3e52fceb1885a.png" 
                  alt="LUMINE Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                  Data Intelligence Platform
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-6">
          {/* Messages Container */}
          <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 mb-6 overflow-hidden flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '500px' }}>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-4 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('ja-JP', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                      <span className="text-gray-600 text-sm">分析中...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-blue-200 p-4 bg-white/50">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="データに関する質問を日本語で入力してください..."
                  className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:outline-none text-blue-800 placeholder-gray-500 bg-white/80"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <i className="ri-send-plane-fill text-lg"></i>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Query Buttons */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-blue-200 shadow-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
              <i className="ri-lightbulb-line text-blue-500 mr-2"></i>
              よく使われる質問例：
            </h3>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuery(sample)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full hover:from-blue-200 hover:to-sky-200 transition-all duration-200 text-xs font-medium border border-blue-300 hover:border-blue-400"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-sm border-t border-blue-200 py-4">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-sm text-blue-600">
              Powered by Lumine Data Intelligence Platform
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
