import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// --- Mock Data Types ---

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: 'Office' | 'Construction' | 'Maintenance' | 'Safety' | 'Value';
  domain: 'Road' | 'Bridge' | 'Railway' | 'Municipal' | 'General';
  icon: string;
  status: 'active' | 'coming_soon';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

// --- Mock Data ---

export const MOCK_USER: User = {
  id: 'u1',
  name: '张伟',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  role: '高级工程师 | 成都市道桥管理处',
};

export const AGENT_CATEGORIES = [
  { id: 'Office', name: '智能办公', icon: 'Globe' },
  { id: 'Construction', name: '智能建设', icon: 'Layers' },
  { id: 'Maintenance', name: '智能养护', icon: 'Wrench' },
  { id: 'Safety', name: '运营智能安全', icon: 'ShieldCheck' },
  { id: 'Value', name: '路价值智能提升', icon: 'TrendingUp' },
] as const;

export const MOCK_AGENTS: Agent[] = [
  // Smart Office
  { id: 'a1', name: '规章制度查询', description: '快速查询公司内部规章制度', category: 'Office', domain: 'General', icon: 'FileText', status: 'active' },
  { id: 'a2', name: '文件检索', description: '全文检索项目文档', category: 'Office', domain: 'General', icon: 'Search', status: 'active' },
  { id: 'a3', name: '公文办公', description: '辅助公文写作与审批', category: 'Office', domain: 'General', icon: 'PenTool', status: 'active' },
  { id: 'a4', name: '智能问数', description: '数据报表智能分析', category: 'Office', domain: 'General', icon: 'BarChart', status: 'active' },
  
  // Smart Construction
  { id: 'c1', name: '投资决策', description: '项目投资风险评估', category: 'Construction', domain: 'General', icon: 'PieChart', status: 'active' },
  { id: 'c2', name: '安全质量管理', description: '施工现场安质环管控', category: 'Construction', domain: 'Municipal', icon: 'HardHat', status: 'active' },

  // Smart Maintenance
  { id: 'm1', name: '养护助手', description: '日常养护工作指引', category: 'Maintenance', domain: 'Road', icon: 'ClipboardList', status: 'active' },
  { id: 'm2', name: '路面病害诊断', description: 'AI识别路面裂缝、坑槽', category: 'Maintenance', domain: 'Road', icon: 'Activity', status: 'active' },
  { id: 'm3', name: '隧道病害诊断', description: '隧道渗漏水、衬砌裂缝分析', category: 'Maintenance', domain: 'Railway', icon: 'Maximize', status: 'active' },

  // Smart Safety
  { id: 's1', name: '智能监测与预警', description: '实时监测结构安全', category: 'Safety', domain: 'Bridge', icon: 'AlertTriangle', status: 'active' },
  { id: 's2', name: '应急响应与处理', description: '突发事件应急预案生成', category: 'Safety', domain: 'Road', icon: 'Siren', status: 'active' },

  // Smart Value
  { id: 'v1', name: '路域资源智能分析', description: '沿线资源开发价值评估', category: 'Value', domain: 'Road', icon: 'Map', status: 'coming_soon' },
  { id: 'v2', name: '通道服务智能提升', description: '服务区服务质量优化建议', category: 'Value', domain: 'Road', icon: 'Coffee', status: 'coming_soon' },
];

// --- Auth Context ---

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('crs_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (username === 'admin' && password === '123456') {
      const newUser = MOCK_USER;
      setUser(newUser);
      localStorage.setItem('crs_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crs_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
