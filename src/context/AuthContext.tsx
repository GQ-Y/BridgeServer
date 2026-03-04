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
  category: 'Supervision' | 'Information' | 'Maintenance';
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
  { id: 'Supervision', name: '督查科', icon: 'ShieldCheck' },
  { id: 'Information', name: '信息科', icon: 'Signal' },
  { id: 'Maintenance', name: '维护科', icon: 'Wrench' },
] as const;

export const MOCK_AGENTS: Agent[] = [
  // --- 督查科 (Supervision) ---
  { id: 'sup1', name: '高风险企业画像', description: '基于历史监管数据生成企业信用画像', category: 'Supervision', domain: 'General', icon: 'UserCheck', status: 'active' },
  { id: 'sup2', name: '申报资料校核', description: '校核申报数据与附件一致性', category: 'Supervision', domain: 'General', icon: 'FileCheck', status: 'active' },
  { id: 'sup3', name: '项目全生命周期查询', description: '查询占挖项目全流程节点数据', category: 'Supervision', domain: 'General', icon: 'GitCommit', status: 'active' },
  { id: 'sup4', name: '多维度统计分析', description: '占挖数据多维度对比统计', category: 'Supervision', domain: 'General', icon: 'BarChart2', status: 'active' },
  { id: 'sup5', name: '设施撒点查询', description: '查询设施关联的占挖项目', category: 'Supervision', domain: 'Road', icon: 'MapPin', status: 'active' },
  { id: 'sup6', name: '月报自动生成', description: '自动生成占挖监管月报', category: 'Supervision', domain: 'General', icon: 'FileText', status: 'active' },
  { id: 'sup7', name: '费用管理', description: '占挖费用收支对比与漏洞分析', category: 'Supervision', domain: 'General', icon: 'DollarSign', status: 'active' },
  { id: 'sup8', name: '费用预测分析', description: '预测经费调整及使用趋势', category: 'Supervision', domain: 'General', icon: 'TrendingUp', status: 'active' },
  { id: 'sup9', name: '项目风险识别', description: '识别占挖项目潜在风险', category: 'Supervision', domain: 'General', icon: 'AlertOctagon', status: 'active' },
  { id: 'sup10', name: '移交设施查询', description: '查询移交状态设施及关联项目', category: 'Supervision', domain: 'Road', icon: 'RefreshCw', status: 'active' },
  { id: 'sup11', name: '证后巡查监管', description: '查询及预警项目巡查完成情况', category: 'Supervision', domain: 'General', icon: 'ClipboardCheck', status: 'active' },

  // --- 信息科 (Information) ---
  { id: 'inf1', name: '地震应急智能分析', description: '地震后快速评估桥梁状况', category: 'Information', domain: 'Bridge', icon: 'Activity', status: 'active' },
  { id: 'inf2', name: '气象预报与指导', description: '局部气象预测与应急建议', category: 'Information', domain: 'General', icon: 'CloudRain', status: 'active' },
  { id: 'inf3', name: '病害深度分析与审计', description: '多源数据融合分析与审计疑点发现', category: 'Information', domain: 'General', icon: 'Search', status: 'active' },

  // --- 维护科 (Maintenance) ---
  { id: 'mnt1', name: '全生命周期档案', description: '一设施一档案数据视图', category: 'Maintenance', domain: 'General', icon: 'Folder', status: 'active' },
  { id: 'mnt2', name: '病害投诉分析与考核', description: '投诉分类统计与维护考核', category: 'Maintenance', domain: 'General', icon: 'MessageCircle', status: 'active' },
  { id: 'mnt3', name: '检测报告分析', description: '分析桥梁检测报告与病害变化', category: 'Maintenance', domain: 'Bridge', icon: 'FileSearch', status: 'active' },
  { id: 'mnt4', name: '病害维护优先级', description: '智能排序病害处置优先级', category: 'Maintenance', domain: 'Road', icon: 'ListOrdered', status: 'active' },
  { id: 'mnt5', name: '维护计划推荐', description: '辅助制定年度维护计划', category: 'Maintenance', domain: 'General', icon: 'Calendar', status: 'active' },
  { id: 'mnt6', name: '多维度统计报表', description: '生成维护日报、月报、年报', category: 'Maintenance', domain: 'General', icon: 'PieChart', status: 'active' },
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
