import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, Plus, MessageSquare, MoreHorizontal, Trash2, BrainCircuit, ChevronDown, ChevronRight, Image as ImageIcon, Video, X } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { MOCK_AGENTS } from '../context/AuthContext';

export default function ChatPage() {
  const { sessions, currentSessionId, sendMessage, selectSession, createSession, getCurrentSession, getAgentById, clearSessions } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<{id: string, name: string} | null>(null);
  const [attachments, setAttachments] = useState<{ type: 'image' | 'video', url: string, file: File }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentSession = getCurrentSession();
  const currentAgent = currentSession ? getAgentById(currentSession.agentId) : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    let msgContent = input;
    if (attachments.length > 0) {
        const attachmentText = attachments.map(a => `[${a.type === 'image' ? '图片' : '视频'}](${a.url})`).join('\n');
        msgContent = `${msgContent}\n\n${attachmentText}`.trim();
    }

    // Pass the selected agent ID if one is selected
    const agentIdToUse = selectedAgent ? selectedAgent.id : undefined;

    setInput('');
    setAttachments([]);
    setSelectedAgent(null); // Clear selected agent after sending
    
    // If an agent is selected, we might want to switch context or just use it for this message
    // For now, we'll pass it as an actionValue or handle it in sendMessage
    await sendMessage(msgContent, agentIdToUse); 
  };

  const handleActionClick = async (value: string, label: string) => {
     await sendMessage(label, value);
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleNewChat = () => {
    createSession('a1'); // Default to general agent
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ mention trigger
    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1) {
        // Only trigger if @ is at start or preceded by space
        const isAtStart = lastAt === 0;
        const isPrecededBySpace = value[lastAt - 1] === ' ';
        
        if (isAtStart || isPrecededBySpace) {
             const query = value.substring(lastAt + 1);
             // If query contains space, assume user finished typing name or is typing something else
             if (!query.includes(' ')) {
                 setShowMentions(true);
                 setMentionQuery(query);
                 return;
             }
        }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (agent: {id: string, name: string}) => {
    // Remove the @query part from input
    const lastAt = input.lastIndexOf('@');
    const newValue = input.substring(0, lastAt);
    
    setInput(newValue);
    setSelectedAgent(agent);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const removeSelectedAgent = () => {
      setSelectedAgent(null);
      inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const url = URL.createObjectURL(file);
        setAttachments(prev => [...prev, { type, url, file }]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const filteredAgents = MOCK_AGENTS.filter(a => 
    a.name.toLowerCase().includes(mentionQuery.toLowerCase()) && a.status === 'active'
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl overflow-hidden">
      {/* Session List Sidebar */}
      <div className="w-64 bg-slate-50 flex flex-col shrink-0">
        <div className="p-4 space-y-2">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#0056b3] text-white py-2 rounded-lg hover:bg-[#004494] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建对话</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg text-sm transition-colors flex items-center gap-3",
                currentSessionId === session.id 
                  ? "bg-white text-[#0056b3]" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="truncate font-medium">{session.title}</div>
            </button>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              暂无历史会话
            </div>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="p-2">
            <button 
              onClick={clearSessions}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 py-2 rounded-lg hover:bg-red-50 transition-colors text-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空历史</span>
            </button>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0 relative">
        {/* Chat Header */}
        <div className="h-14 flex items-center justify-between px-6 bg-white shrink-0 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#0056b3]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{currentAgent?.name || '智能助手'}</h3>
              <p className="text-xs text-slate-500">{currentAgent?.description || '随时为您服务'}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
          {currentSession ? (
            currentSession.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 max-w-3xl",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-slate-200" : "bg-[#0056b3]"
                )}>
                  {msg.role === 'user' ? (
                    <img src={user?.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Bot className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Content Container */}
                <div className="flex flex-col gap-2 max-w-[85%]">
                    {/* Bubble */}
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-[#0056b3] text-white rounded-tr-none" 
                        : "bg-white text-slate-800 rounded-tl-none"
                    )}>
                      {/* Thinking Process (Chain of Thought) */}
                      {msg.role === 'assistant' && (msg as any).thinking && (
                        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/30 overflow-hidden">
                          <button 
                            onClick={() => toggleThought(msg.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 hover:bg-blue-50/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <BrainCircuit className="w-3.5 h-3.5 text-[#0056b3]" />
                              <span className="font-medium text-[#0056b3]/80 group-hover:text-[#0056b3]">深度思考过程</span>
                            </div>
                            {expandedThoughts[msg.id] ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          
                          {expandedThoughts[msg.id] && (
                             <div className="px-3 pb-3 pt-1 text-xs text-slate-600 font-mono whitespace-pre-wrap border-t border-blue-100/50 bg-blue-50/10 animate-in fade-in slide-in-from-top-1 duration-200">
                               {(msg as any).thinking}
                             </div>
                          )}
                        </div>
                      )}

                      {msg.role === 'assistant' ? (
                        <div className="markdown-body">
                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">
                            {msg.content}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {msg.role === 'assistant' && (msg as any).actions && (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {(msg as any).actions.map((action: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleActionClick(action.value, action.label)}
                                    className="text-xs px-3 py-1.5 bg-blue-50 text-[#0056b3] rounded-lg hover:bg-[#0056b3] hover:text-white transition-colors flex items-center gap-1"
                                >
                                    {action.label}
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <p>选择一个智能体开始对话</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mentions Dropdown */}
        {showMentions && filteredAgents.length > 0 && (
            <div className="absolute bottom-[80px] left-6 bg-white rounded-lg shadow-xl border border-slate-100 w-64 max-h-48 overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2 text-xs text-slate-400 border-b border-slate-50">选择智能体</div>
                {filteredAgents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => handleMentionSelect(agent)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-slate-700 flex items-center gap-2"
                    >
                        <Bot className="w-4 h-4 text-[#0056b3]" />
                        <span>{agent.name}</span>
                    </button>
                ))}
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white shrink-0 relative">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                        {att.type === 'image' ? (
                            <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Video className="w-6 h-6 text-slate-400" />
                            </div>
                        )}
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
          )}

          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center gap-2">
            <div className="flex-1 relative flex items-center bg-slate-50 rounded-full pr-24 pl-4 py-2 min-h-[56px]">
                {/* Selected Agent Chip */}
                {selectedAgent && (
                    <div className="flex items-center gap-1 bg-blue-100 text-[#0056b3] px-2 py-1 rounded-full text-xs mr-2 shrink-0 animate-in fade-in zoom-in duration-200">
                        <Bot className="w-3 h-3" />
                        <span className="font-medium">@{selectedAgent.name}</span>
                        <button 
                            type="button" 
                            onClick={removeSelectedAgent}
                            className="ml-1 hover:text-red-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={selectedAgent ? "输入消息..." : "输入消息... (@调用智能体)"}
                  disabled={!currentSessionId}
                  className="flex-1 bg-transparent focus:outline-none py-2 text-sm"
                />
                
                {/* Attachment Buttons inside Input */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!currentSessionId}
                        className="p-2 text-slate-400 hover:text-[#0056b3] transition-colors rounded-full hover:bg-blue-50"
                        title="上传图片/视频"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={handleFileSelect}
                    />
                </div>
            </div>
            
            <button 
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || !currentSessionId}
              className="w-12 h-12 bg-[#0056b3] text-white rounded-full flex items-center justify-center hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2 text-[10px] text-slate-400">
            内容由 AI 生成，仅供参考，请仔细甄别
          </div>
        </div>
      </div>
    </div>
  );
}
