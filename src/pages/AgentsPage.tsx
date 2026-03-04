import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { AGENT_CATEGORIES, MOCK_AGENTS } from '../context/AuthContext';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { createSession } = useChat();

  const handleAgentClick = (agentId: string) => {
    createSession(agentId);
    navigate('/chat');
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">智能助手</h2>
        <p className="text-slate-500">选择专业的智能助手为您服务</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 snap-x">
        {AGENT_CATEGORIES.map((category) => {
          const IconComponent = (Icons as any)[category.icon] || Icons.Box;
          const agents = MOCK_AGENTS.filter(a => a.category === category.id);

          return (
            <div key={category.id} className="min-w-[280px] flex-1 snap-start">
              {/* Category Header Card - Flat */}
              <div className="bg-white rounded-xl p-6 mb-4 flex flex-col items-center text-center h-[160px] justify-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#0056b3]" />
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <IconComponent className="w-7 h-7 text-[#0056b3]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{category.name}</h3>
              </div>

              {/* Agent List - Flat */}
              <div className="flex flex-col gap-3">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => agent.status === 'active' && handleAgentClick(agent.id)}
                    disabled={agent.status !== 'active'}
                    className={cn(
                      "w-full bg-white p-4 rounded-xl text-left transition-colors duration-200 group relative overflow-hidden",
                      agent.status === 'active' 
                        ? "hover:bg-blue-50 cursor-pointer" 
                        : "opacity-60 cursor-not-allowed bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-slate-700 group-hover:text-[#0056b3] transition-colors">{agent.name}</span>
                      {agent.status !== 'active' && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded">敬请期待</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{agent.description}</p>
                    
                    {/* Domain Tag */}
                    <div className="mt-3 flex">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded",
                        agent.domain === 'Road' ? "bg-orange-50 text-orange-600" :
                        agent.domain === 'Bridge' ? "bg-purple-50 text-purple-600" :
                        agent.domain === 'Railway' ? "bg-blue-50 text-blue-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {agent.domain === 'General' ? '通用' : 
                         agent.domain === 'Road' ? '道路' :
                         agent.domain === 'Bridge' ? '桥梁' :
                         agent.domain === 'Railway' ? '铁路' : '市政'}
                      </span>
                    </div>
                  </button>
                ))}
                
                {agents.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm bg-white/50 rounded-xl">
                    暂无智能体
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
