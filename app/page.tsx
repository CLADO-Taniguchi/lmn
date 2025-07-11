
'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // データ取得処理のシミュレーション
    setTimeout(() => {
      setIsLoading(false);
      alert('データを取得しました');
    }, 2000);
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

      <div className="relative z-10">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 bg-transparent">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex justify-start">
              <img 
                src="https://static.readdy.ai/image/60a7852ea0ff95e4321c1f6f322cd6f8/33f7c24daa878e3690d3e52fceb1885a.png" 
                alt="LUMINE Logo" 
                className="h-12 w-auto drop-shadow-lg"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12 pt-32">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-blue-900 mb-8" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              Lumine Data Intelligence Platform
            </h2>
          </div>

          {/* Query Input Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-blue-800 font-medium mb-3 text-lg">
                  知りたいことを日本語で入力してください：
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例：2024年から今日までの会員数を調べて
                  例：都道府県別の売上ランキングを表示して
                  例：先月の売上と前年同月を比較して"
                  className="w-full h-32 p-4 border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:outline-none resize-none text-blue-800 placeholder-gray-500 bg-white/80"
                  maxLength={500}
                />
                <div className="text-right text-sm text-blue-600 mt-2">
                  {query.length}/500
                </div>
              </div>

              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-8 rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>データを取得中...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <i className="ri-search-line text-lg"></i>
                    <span>データを調べる</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Sample Queries */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-blue-200 shadow-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <i className="ri-lightbulb-line text-blue-500 mr-2"></i>
              よく使われる質問例：
            </h3>
            <div className="flex flex-wrap gap-3">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sample)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full hover:from-blue-200 hover:to-sky-200 transition-all duration-200 text-sm font-medium border border-blue-300 hover:border-blue-400 cursor-pointer whitespace-nowrap"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-blue-200 text-center shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-chat-3-line text-white text-xl"></i>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">自然言語対応</h4>
              <p className="text-blue-700 text-sm">日本語で質問するだけでデータを取得</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-blue-200 text-center shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-line-chart-line text-white text-xl"></i>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">リアルタイム分析</h4>
              <p className="text-blue-700 text-sm">最新のファッションデータを即座に分析</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-blue-200 text-center shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-white text-xl"></i>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">セキュア</h4>
              <p className="text-blue-700 text-sm">企業データを安全に管理・分析</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-sm border-t border-blue-200 mt-16">
          <div className="max-w-6xl mx-auto px-6 py-8">
          </div>
        </footer>
      </div>
    </div>
  );
}
