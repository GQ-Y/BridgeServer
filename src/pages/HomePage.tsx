import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { AGENT_CATEGORIES, MOCK_AGENTS } from '../context/AuthContext';
import { Send, Sparkles, AtSign, X } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<typeof MOCK_AGENTS[0] | null>(null);
  const [atTriggerPos, setAtTriggerPos] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { createSession, sendMessage } = useChat();

  const filteredAgents = MOCK_AGENTS.filter(a =>
    agentSearch === '' || a.name.includes(agentSearch) || a.description.includes(agentSearch)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart ?? val.length;
    const lastAt = val.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1) {
      const afterAt = val.slice(lastAt + 1, cursor);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setAtTriggerPos(lastAt);
        setAgentSearch(afterAt);
        setShowAgentPicker(true);
        return;
      }
    }
    setShowAgentPicker(false);
    setAtTriggerPos(-1);
    setAgentSearch('');
  };

  const selectAgent = useCallback((agent: typeof MOCK_AGENTS[0]) => {
    setSelectedAgent(agent);
    if (atTriggerPos !== -1) {
      const before = input.slice(0, atTriggerPos);
      const cursor = textareaRef.current?.selectionStart ?? input.length;
      const after = input.slice(cursor);
      setInput(before + after);
    }
    setShowAgentPicker(false);
    setAtTriggerPos(-1);
    setAgentSearch('');
    textareaRef.current?.focus();
  }, [input, atTriggerPos]);

  const clearSelectedAgent = () => {
    setSelectedAgent(null);
  };

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedAgent) return;

    const agentId = selectedAgent ? selectedAgent.id : 'sup4';
    createSession(agentId);
    if (input.trim()) {
      await sendMessage(input.trim());
    }
    navigate('/chat');
  };

  const handleAgentDirectStart = (agentId: string) => {
    createSession(agentId);
    navigate('/chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAgentPicker && (e.key === 'Escape')) {
      setShowAgentPicker(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !showAgentPicker) {
      e.preventDefault();
      handleQuickStart(e as unknown as React.FormEvent);
    }
  };

  const handleQuickTag = (tag: string) => {
    setInput(prev => prev + tag);
    textareaRef.current?.focus();
  };

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowAgentPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const categoryCards = AGENT_CATEGORIES.map(cat => {
    const agents = MOCK_AGENTS.filter(a => a.category === cat.id);
    return { ...cat, agents };
  });

  const groupedAgents: Record<string, typeof MOCK_AGENTS> = {};
  filteredAgents.forEach(a => {
    if (!groupedAgents[a.category]) groupedAgents[a.category] = [];
    groupedAgents[a.category].push(a);
  });
  const categoryNameMap: Record<string, string> = {
    Supervision: '督查科',
    Information: '信息科',
    Maintenance: '维护科',
  };

  const canSubmit = input.trim().length > 0 || selectedAgent !== null;

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
        <p className="text-slate-500 text-lg">您好，欢迎使用<strong>路桥通</strong> · 成都路桥AI大模型助手，您需要我做什么？</p>
      </div>

      {/* Smart Agent Square */}
      <div className="w-full mb-12">
        <div className="flex items-center gap-2 mb-6 text-slate-700 font-semibold">
          <Sparkles className="w-5 h-5 text-[#0099cc]" />
          <span>智能体广场</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryCards.map((cat, idx) => {
            const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] || Icons.Box;
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
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm relative group transition-all border border-slate-100 focus-within:border-blue-200 focus-within:shadow-md">

        {/* Quick Tags */}
        <div className="flex gap-2 mb-2 px-4 pt-3 overflow-x-auto no-scrollbar">
          {['规章制度查询', '文件检索', '公文办公', '智能问数'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTag(tag)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Selected Agent Badge */}
        {selectedAgent && (
          <div className="flex items-center gap-2 px-4 pb-1">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200">
              <AtSign className="w-3 h-3" />
              <span className="font-medium">{selectedAgent.name}</span>
              <button
                type="button"
                onClick={clearSelectedAgent}
                className="ml-1 text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-slate-400">已选中，将直接开始与该智能体对话</span>
          </div>
        )}

        {/* Textarea */}
        <form onSubmit={handleQuickStart} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入 @ 召唤智能体并提问，或直接输入内容开始对话..."
            className="w-full min-h-[100px] p-4 pr-14 resize-none outline-none text-slate-700 placeholder:text-slate-300 rounded-xl bg-transparent"
          />

          {/* @ Trigger Hint */}
          {!input && !selectedAgent && (
            <div className="absolute bottom-14 left-4 flex items-center gap-1 text-xs text-slate-300 pointer-events-none">
              <AtSign className="w-3 h-3" />
              <span>输入 @ 可选择智能体</span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newVal = input + '@';
                setInput(newVal);
                setAtTriggerPos(newVal.length - 1);
                setAgentSearch('');
                setShowAgentPicker(true);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              title="召唤智能体"
            >
              <AtSign className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="p-2 bg-[#0056b3] text-white rounded-lg hover:bg-[#004494] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* @ Agent Picker Dropdown */}
        {showAgentPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <AtSign className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-700">选择智能体</span>
              {agentSearch && (
                <span className="text-xs text-slate-400 ml-auto">搜索: {agentSearch}</span>
              )}
            </div>

            {Object.keys(groupedAgents).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">未找到匹配的智能体</div>
            ) : (
              Object.entries(groupedAgents).map(([catId, agents]) => (
                <div key={catId}>
                  <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {categoryNameMap[catId] || catId}
                  </div>
                  {agents.map(agent => {
                    const IconComp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[agent.icon] || Icons.Box;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => selectAgent(agent)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 bg-[#f0f7ff] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                          <IconComp className="w-4 h-4 text-[#0056b3]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 group-hover:text-blue-700">{agent.name}</div>
                          <div className="text-xs text-slate-400 truncate">{agent.description}</div>
                        </div>
                        <div className="ml-auto shrink-0">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">选择</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}

            {/* Quick direct start buttons */}
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400 mb-2">快速直达</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_AGENTS.slice(0, 5).map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleAgentDirectStart(agent.id)}
                    className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    直达 · {agent.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <p className="mt-4 text-xs text-slate-400 flex items-center gap-1">
        <Icons.Info className="w-3 h-3" />
        支持 @ 召唤指定智能体，或直接输入问题由系统自动路由
      </p>
    </div>
  );
}
