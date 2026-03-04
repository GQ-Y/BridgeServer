import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Agent, ChatSession, Message, MOCK_AGENTS } from './AuthContext';

// Simple ID generator since we don't have uuid package installed and I don't want to install just for this
const generateId = () => Math.random().toString(36).substring(2, 9);

// Extend Message type to include thinking process and actions
export interface ExtendedMessage extends Message {
  thinking?: string; // The "thought process" or "chain of thought"
  actions?: {
    label: string;
    value: string;
    type: 'button' | 'link';
  }[];
}

export interface ExtendedChatSession extends Omit<ChatSession, 'messages'> {
  messages: ExtendedMessage[];
}

interface ChatContextType {
  sessions: ExtendedChatSession[];
  currentSessionId: string | null;
  createSession: (agentId: string) => string;
  sendMessage: (content: string, actionValue?: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  getCurrentSession: () => ExtendedChatSession | undefined;
  getAgentById: (id: string) => Agent | undefined;
  clearSessions: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ExtendedChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from local storage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('crs_sessions_v2');
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }
  }, []);

  // Save sessions to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('crs_sessions_v2', JSON.stringify(sessions));
  }, [sessions]);

  const createSession = (agentId: string) => {
    const agent = MOCK_AGENTS.find(a => a.id === agentId);
    
    // Customized greeting based on agent
    let greeting = '您好，请问有什么可以帮您？';
    if (agent) {
        greeting = `您好，我是**${agent.name}**。\n\n${agent.description}。`;
        if (agent.id === 'a1') greeting += '\n\n我可以帮您查询：\n- 考勤休假制度\n- 财务报销流程\n- 车辆管理规定';
        else if (agent.id === 'a2') greeting += '\n\n请输入关键词，我将为您检索项目全生命周期文档。';
        else if (agent.id === 'a3') greeting += '\n\n我可以帮您：\n- 起草通知公告\n- 撰写会议纪要\n- 检查公文格式';
        else if (agent.id === 'a4') greeting += '\n\n请告诉我您想分析的数据，例如：“上个月养护成本”或“年度完工率”。';
        else if (agent.id === 'c1') greeting += '\n\n请输入项目基本参数，我将为您进行投资回报测算及风险评估。';
        else if (agent.id === 'c2') greeting += '\n\n我可以协助您进行：\n- 现场隐患排查\n- 质量验评标准查询\n- 安全教育培训';
        else if (agent.id === 'm1') greeting += '\n\n遇到养护难题了吗？我可以提供标准作业指导书(SOP)和专家建议。';
        else if (agent.id === 'm2') greeting += '\n\n请上传路面病害照片，我将为您识别病害类型并推荐处治方案。';
        else if (agent.id === 'm3') greeting += '\n\n请描述隧道病害特征或上传检测数据，我将为您判定病害等级。';
        else if (agent.id === 's1') greeting += '\n\n我正在实时连接 K45+200 特大桥监测系统。您可以询问“当前监测状态”或“历史预警记录”。';
        else if (agent.id === 's2') greeting += '\n\n遇到突发事件？请简要描述事件类型（如：交通事故、塌方），我将立即为您生成应急预案。';
    }

    const newSession: ExtendedChatSession = {
      id: generateId(),
      agentId,
      title: agent ? `${agent.name} 会话` : '新会话',
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: greeting,
          timestamp: Date.now(),
        }
      ],
      lastUpdated: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const sendMessage = async (content: string, actionValue?: string) => {
    if (!currentSessionId) return;

    // Add user message
    const userMsg: ExtendedMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [...session.messages, userMsg],
          lastUpdated: Date.now(),
        };
      }
      return session;
    }));

    // Simulate AI Processing
    const currentSession = sessions.find(s => s.id === currentSessionId);
    
    // Use the override agent if provided, otherwise default to session agent
    const effectiveAgentId = actionValue && MOCK_AGENTS.find(a => a.id === actionValue) 
        ? actionValue 
        : (currentSession?.agentId);

    // Determine response based on input content or actionValue
    let responseContent = '';
    let thinkingProcess = '';
    let actions: ExtendedMessage['actions'] = undefined;

    // --- Agent Specific Logic ---

    // A1: 规章制度查询
    if (effectiveAgentId === 'a1') {
        if (content.includes('请假') || content.includes('休假') || actionValue === 'ask_leave') {
            thinkingProcess = '1. 识别关键词：“请假”、“休假”。\n2. 检索数据库：查询《员工考勤管理办法》 (2025修订版)。\n3. 提取相关条款：第三章“请假流程”。';
            responseContent = '根据《员工考勤管理办法》第三章规定：\n\n1. **事假**：需提前 1 天申请，由部门负责人审批。\n2. **病假**：需提供二级以上医院诊断证明。\n3. **年假**：工作满 1 年可享受 5 天带薪年假。\n\n您需要下载完整的制度文件吗？';
            actions = [{ label: '下载制度文件', value: 'download_policy', type: 'button' }, { label: '发起请假申请', value: 'start_leave_process', type: 'button' }];
        } else if (actionValue === 'download_policy') {
            thinkingProcess = '正在生成下载链接...';
            responseContent = '已为您找到《员工考勤管理办法_2025.pdf》，点击下方链接下载。';
            actions = [{ label: '点击下载', value: 'download_link', type: 'link' }];
        } else {
            thinkingProcess = '正在检索知识库...';
            responseContent = '我可以为您查询考勤、报销、车辆管理等制度。请明确您的问题。';
        }
    }
    // A2: 文件检索
    else if (effectiveAgentId === 'a2') {
        if (content.includes('图纸') || content.includes('设计') || actionValue === 'search_drawings') {
            thinkingProcess = '1. 解析需求：查找“图纸”。\n2. 过滤条件：最新版本、施工图。\n3. 检索结果：找到 3 份相关文档。';
            responseContent = '为您找到以下相关图纸：\n\n1. **K12+300~K15+000 路基施工图_v3.dwg** (2025-01-15)\n2. **特大桥主墩结构设计图_终版.pdf** (2024-12-20)\n3. **附属设施设计变更单_02.jpg** (2025-02-10)';
            actions = [{ label: '预览第一份', value: 'preview_doc_1', type: 'button' }, { label: '打包下载', value: 'download_all', type: 'button' }];
        } else {
            thinkingProcess = '正在全文检索...';
            responseContent = '请告诉我您需要查找的文件关键词，例如“会议纪要”或“施工日志”。';
        }
    }
    // A3: 公文办公
    else if (effectiveAgentId === 'a3') {
        if (content.includes('通知') || content.includes('写') || actionValue === 'write_notice') {
            thinkingProcess = '1. 识别意图：公文写作。\n2. 确定类型：通知。\n3. 调用模板：标准行政通知模板。\n4. 生成草稿...';
            responseContent = '已为您生成《关于开展春季安全大检查的通知》草稿：\n\n**主送**：各项目部\n**正文**：\n为切实做好春季施工安全工作，消除安全隐患，经研究决定，于 3 月 10 日起开展全线安全大检查...\n\n请审阅。';
            actions = [{ label: '优化措辞', value: 'refine_text', type: 'button' }, { label: '发起OA审批', value: 'start_approval', type: 'button' }];
        } else {
            thinkingProcess = '等待指令...';
            responseContent = '我可以帮您起草通知、报告、纪要等公文。请告诉我您的写作需求。';
        }
    }
    // A4: 智能问数
    else if (effectiveAgentId === 'a4') {
        if (content.includes('成本') || content.includes('报表') || actionValue === 'analyze_cost') {
            thinkingProcess = '1. 连接财务数据库。\n2. 提取数据：2026年2月养护成本。\n3. 数据分析：同比下降 5%，环比上升 2%。\n4. 生成图表描述。';
            responseContent = '2026年2月养护总成本为 **125.8万元**。\n\n- **材料费**: 80.5万元 (占比 64%)\n- **人工费**: 35.2万元 (占比 28%)\n- **机械费**: 10.1万元 (占比 8%)\n\n整体成本控制在预算范围内。';
            actions = [{ label: '查看详细报表', value: 'view_detail_report', type: 'button' }, { label: '导出Excel', value: 'export_excel', type: 'button' }];
        } else {
            thinkingProcess = '正在解析数据请求...';
            responseContent = '请告诉我您想了解的经营数据，例如“进度”、“成本”或“质量合格率”。';
        }
    }
    // C1: 投资决策
    else if (effectiveAgentId === 'c1') {
        if (content.includes('回报') || content.includes('风险') || actionValue === 'risk_assessment') {
            thinkingProcess = '1. 读取项目参数。\n2. 运行蒙特卡洛模拟。\n3. 计算指标：IRR=8.5%, NPV=1.2亿。\n4. 风险提示：原材料价格波动风险高。';
            responseContent = '根据当前参数测算：\n\n- **内部收益率 (IRR)**: 8.5%\n- **净现值 (NPV)**: 1.2 亿元\n- **投资回收期**: 12.5 年\n\n**主要风险点**：\n近期钢材价格波动较大，建议锁定部分原材料采购价格。';
            actions = [{ label: '生成详细报告', value: 'gen_invest_report', type: 'button' }, { label: '调整测算参数', value: 'adjust_params', type: 'button' }];
        } else {
            thinkingProcess = '准备测算模型...';
            responseContent = '请输入项目概况或上传可行性研究报告，我将为您进行投资分析。';
        }
    }
    // C2: 安全质量管理
    else if (effectiveAgentId === 'c2') {
        if (content.includes('违规') || content.includes('检查') || actionValue === 'safety_check') {
            thinkingProcess = '1. 分析现场描述/图片。\n2. 匹配规范：《建筑施工安全检查标准》。\n3. 识别问题：未佩戴安全帽、临边防护缺失。';
            responseContent = '根据描述，现场存在以下违规行为：\n\n1. **高处作业**：2名工人未系安全带 (严重违规)。\n2. **临边防护**：基坑周边护栏缺失。\n\n建议立即停工整改。';
            actions = [{ label: '下发整改通知单', value: 'issue_rectification', type: 'button' }, { label: '查看相关规范', value: 'view_safety_code', type: 'button' }];
        } else {
            thinkingProcess = '监听安全管理指令...';
            responseContent = '我可以协助您进行现场隐患排查或查询安质环规范。';
        }
    }
    // M1: 养护助手
    else if (effectiveAgentId === 'm1') {
        if (content.includes('修补') || content.includes('工艺') || actionValue === 'repair_method') {
            thinkingProcess = '1. 检索关键词：“沥青路面”、“修补”。\n2. 匹配SOP：沥青路面坑槽冷补工艺。\n3. 提取关键步骤。';
            responseContent = '为您推荐 **沥青路面坑槽冷补工艺**：\n\n1. **划线**：沿坑槽四周划出切缝线。\n2. **开槽**：沿线切割，清除废料。\n3. **清理**：吹净槽内灰尘和积水。\n4. **填料**：填入冷补料，高出路面 1-2cm。\n5. **压实**：使用平板夯压实。';
            actions = [{ label: '查看教学视频', value: 'view_video', type: 'button' }, { label: '计算材料用量', value: 'calc_material', type: 'button' }];
        } else {
            thinkingProcess = '正在查询养护知识库...';
            responseContent = '请问您需要查询哪种病害的处治工艺？例如“路面裂缝”或“护栏清洗”。';
        }
    }
    // M2: 路面病害诊断
    else if (effectiveAgentId === 'm2') {
        if (content.includes('裂缝') || content.includes('坑槽') || actionValue === 'pavement_check') {
            thinkingProcess = '1. 调用视觉模型 (Model-V-Road-02)。\n2. 图像分割：识别出网状裂缝。\n3. 计算面积：约 2.5 平方米。\n4. 判定等级：重度龟裂。';
            responseContent = '识别结果：**重度龟裂 (鳄鱼皮裂缝)**\n\n- **面积**: 2.5 m²\n- **成因**: 基层强度不足或水损害。\n- **建议**: 挖补处理，重铺基层和面层。';
            actions = [{ label: '生成维修工单', value: 'create_work_order', type: 'button' }, { label: '加入维修计划', value: 'add_to_plan', type: 'button' }];
        } else {
            thinkingProcess = '准备图像识别...';
            responseContent = '请上传路面照片，我将为您识别病害类型并计算工程量。';
        }
    }
    // M3: 隧道病害诊断 (Existing logic refined)
    else if (effectiveAgentId === 'm3') {
        if (content.includes('隧道') || content.includes('病害') || content.includes('裂缝') || actionValue === 'tunnel_check') {
            thinkingProcess = `
1. **分析用户意图**: 用户请求识别隧道病害隐患。
2. **调用视觉模型**: 加载隧道衬砌图像识别模型 (Model-V-Tunnel-04)。
3. **扫描特征**: 
    - 识别到拱顶区域有不规则裂缝。
    - 裂缝宽度约 0.5mm，长度 2.3m。
    - 伴有轻微渗水痕迹。
4. **判定等级**: 根据《公路隧道养护技术规范》，判定为 2A 级病害。
5. **生成建议**: 建议进行裂缝修补及防水处理。
            `.trim();
            responseContent = `经分析，该隧道拱顶位置存在**纵向裂缝**，伴有轻微渗水。\n\n**病害详情**：\n- **类型**: 纵向裂缝 (2A级)\n- **位置**: K12+340 拱顶\n- **尺寸**: 长约 2.3m，宽约 0.5mm\n\n**建议措施**：\n建议立即进行裂缝封闭处理，并持续监测渗水情况。是否需要生成详细的维修方案？`;
            actions = [
                { label: '生成维修方案', value: 'gen_repair_plan', type: 'button' },
                { label: '查看类似案例', value: 'view_similar_cases', type: 'button' }
            ];
        } else if (actionValue === 'gen_repair_plan') {
            thinkingProcess = `
1. **接收指令**: 生成维修方案。
2. **检索知识库**: 查找“隧道裂缝修补”标准工艺。
3. **匹配方案**: 匹配到“环氧树脂注浆法”。
4. **生成文档**: 正在生成施工步骤及材料清单...
            `.trim();
            responseContent = `已为您生成《隧道拱顶裂缝处治方案》。\n\n**主要工艺**：\n1. **表面处理**: 清理裂缝表面灰尘及杂物。\n2. **埋设注浆嘴**: 沿裂缝每隔 30cm 设置一个注浆嘴。\n3. **封缝**: 使用快干水泥封闭裂缝表面。\n4. **注浆**: 注入改性环氧树脂浆液。\n\n请确认是否下发至养护工区？`;
            actions = [
                { label: '下发工单', value: 'dispatch_order', type: 'button' },
                { label: '修改方案', value: 'modify_plan', type: 'button' }
            ];
        } else {
             thinkingProcess = '等待输入...';
             responseContent = '请描述隧道病害情况，我将为您进行诊断。';
        }
    }
    // S1: 智能监测与预警 (Existing logic refined)
    else if (effectiveAgentId === 's1') {
        if (content.includes('桥梁') || content.includes('隐患') || content.includes('监测') || actionValue === 'bridge_check') {
             thinkingProcess = `
1. **数据接入**: 获取 K45+200 特大桥传感器实时数据。
2. **异常检测**: 
    - 3# 墩台沉降传感器读数异常 (偏移量 > 阈值 5%)。
    - 伸缩缝位移数据正常。
3. **关联分析**: 近期该区域有持续降雨，可能导致地基松软。
4. **风险评估**: 存在不均匀沉降风险，风险等级：黄色预警。
             `.trim();
             responseContent = `监测到 **K45+200 特大桥 3# 墩台** 出现异常沉降趋势。\n\n**监测数据**：\n- **当前沉降量**: 12.5mm (累计)\n- **变化速率**: 0.8mm/24h (超过黄色预警阈值)\n\n**原因推测**：\n近期连续降雨导致地基承载力下降。建议立即安排人工复测。`;
             actions = [
                 { label: '发起人工复测', value: 'manual_check', type: 'button' },
                 { label: '查看历史曲线', value: 'view_history', type: 'button' }
             ];
        } else if (actionValue === 'manual_check') {
            thinkingProcess = '正在调度最近的养护巡查人员...';
            responseContent = '已生成巡查工单 (No. 20260304-001)，已指派给 **第三养护工区 - 张伟组**。预计 2 小时内到达现场。';
        } else {
            thinkingProcess = '连接监测系统...';
            responseContent = '监测系统在线。您可以询问“当前状态”或“预警信息”。';
        }
    }
    // S2: 应急响应与处理
    else if (effectiveAgentId === 's2') {
        if (content.includes('事故') || content.includes('塌方') || actionValue === 'emergency_event') {
            thinkingProcess = '1. 识别事件类型：交通事故（危化品泄漏）。\n2. 确定等级：II级突发事件。\n3. 匹配预案：《危化品运输事故应急预案》。\n4. 生成处置流程。';
            responseContent = '已启动 **II级应急响应**。\n\n**处置建议**：\n1. **封锁现场**：以事故点为中心 500m 范围实施交通管制。\n2. **人员疏散**：疏散下风向居民。\n3. **专业处置**：通知消防及环保部门进行洗消。\n\n是否一键通知应急指挥中心？';
            actions = [{ label: '一键通知', value: 'notify_center', type: 'button' }, { label: '查看完整预案', value: 'view_plan', type: 'button' }];
        } else if (actionValue === 'notify_center') {
            thinkingProcess = '正在呼叫应急指挥中心...\n发送位置信息...\n发送现场简报...';
            responseContent = '已成功通知应急指挥中心。救援队伍正在集结，预计 15 分钟到达现场。';
        } else {
            thinkingProcess = '待命状态...';
            responseContent = '请报告突发事件类型，我将为您提供应急处置方案。';
        }
    }
    // Fallback
    else {
        thinkingProcess = '正在理解用户意图...\n检索通用知识库...';
        responseContent = `收到您的消息：“${content}”。\n\n作为${MOCK_AGENTS.find(a => a.id === effectiveAgentId)?.name || '智能助手'}，我可以为您提供相关领域的专业建议。`;
    }

    // Delay to simulate network/processing

    setTimeout(() => {
      const aiMsg: ExtendedMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        thinking: thinkingProcess,
        actions: actions,
        timestamp: Date.now(),
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, aiMsg],
            lastUpdated: Date.now(),
          };
        }
        return session;
      }));
    }, 1500);
  };

  const clearSessions = () => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem('crs_sessions_v2');
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);
  const getAgentById = (id: string) => MOCK_AGENTS.find(a => a.id === id);

  return (
    <ChatContext.Provider value={{ sessions, currentSessionId, createSession, sendMessage, selectSession, getCurrentSession, getAgentById, clearSessions }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
