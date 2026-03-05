import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { AGENT_CATEGORIES, MOCK_AGENTS } from '../context/AuthContext';
import { Send, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function HomePage() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const { createSession, sendMessage } = useChat();

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Create a general session - defaulting to 'sup1' (High Risk Enterprise) as an entry point, 
    // or we could create a specific 'general' agent. For now, let's use 'sup1' or just let it be generic.
    // If we want a generic chat, we might need a 'general' agent in the list.
    // Let's use 'sup4' (Multi-dimensional Statistics) as it's quite general.
    const sessionId = createSession('sup4'); 
    await sendMessage(input);
    navigate('/chat');
  };

  const handleAgentClick = (agentId: string) => {
    createSession(agentId);
    navigate('/chat');
  };

  // Group agents by category for the "Smart Agent Square" display
  // We will display one "Hero" card for each category
  const categoryCards = AGENT_CATEGORIES.map(cat => {
    // Find representative agents for this category
    const agents = MOCK_AGENTS.filter(a => a.category === cat.id);
    return {
      ...cat,
      agents
    };
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center mb-6">
           <div className="bg-blue-50 p-4 rounded-2xl">
             <Icons.Globe className="w-12 h-12 text-[#0056b3]" />
           </div>
        </div>
        <h1 className="text-4xl font-bold text-[#0056b3] mb-3 tracking-tight">交运天下 通达未来</h1>
        <p className="text-slate-500 text-lg">您好，欢迎使用“路小通”成都道桥安全领域大模型，您需要我做什么？</p>
      </div>

      {/* Smart Agent Square */}
      <div className="w-full mb-12">
        <div className="flex items-center gap-2 mb-6 text-slate-700 font-semibold">
          <Sparkles className="w-5 h-5 text-[#0099cc]" />
          <span>智能体广场</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryCards.map((cat, idx) => {
            const IconComponent = (Icons as any)[cat.icon] || Icons.Box;
            return (
              <div 
                key={cat.id}
                className="group relative bg-white rounded-xl p-6 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                onClick={() => navigate('/agents')}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
                  <div className="w-16 h-16 bg-[#f0f7ff] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white transition-colors duration-200">
                    <IconComponent className="w-8 h-8 text-[#0056b3]" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {cat.agents.length > 0 ? `${cat.agents.length} 个智能体可用` : '敬请期待'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Input */}
      <div className="w-full max-w-4xl bg-white rounded-2xl p-2 relative group transition-all">
        <div className="flex gap-2 mb-2 px-4 pt-2 overflow-x-auto no-scrollbar">
          {['规章制度查询', '文件检索', '公文办公', '智能问数'].map(tag => (
            <button key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap">
              {tag}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleQuickStart} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickStart(e);
              }
            }}
            placeholder="输入 @ 召唤智能体并提问..."
            className="w-full min-h-[100px] p-4 pr-12 resize-none outline-none text-slate-700 placeholder:text-slate-300 rounded-xl bg-transparent"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button type="button" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Icons.Image className="w-5 h-5" />
            </button>
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="p-2 bg-[#0056b3] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
