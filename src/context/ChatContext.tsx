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
    let initialActions: ExtendedMessage['actions'] = undefined;

    if (agent) {
        greeting = `您好，我是**${agent.name}**。\n\n${agent.description}。`;
        
        // Supervision Agents
        if (agent.id === 'sup1') {
            greeting += '\n\n请输入企业名称或统一社会信用代码，我将为您生成信用画像。';
            initialActions = [{ label: '查询"成都XX建设"信用画像', value: 'check_credit', type: 'button' }];
        }
        else if (agent.id === 'sup2') {
            greeting += '\n\n请上传申报单号及PDF附件，我将为您校核资料一致性。';
            initialActions = [{ label: '校核申报单 SQ-2026-03-005', value: 'check_application', type: 'button' }];
        }
        else if (agent.id === 'sup3') {
            greeting += '\n\n请输入许可证编号或项目名称，查询项目全生命周期数据。';
            initialActions = [{ label: '查询"人民南路抢修"全生命周期', value: 'query_lifecycle', type: 'button' }];
        }
        else if (agent.id === 'sup4') {
            greeting += '\n\n请告诉我您想统计的维度（如区域、时间、类型），我将为您生成分析报表。';
            initialActions = [{ label: '生成锦江区3月占道统计', value: 'gen_stats', type: 'button' }];
        }
        else if (agent.id === 'sup5') {
            greeting += '\n\n请输入道路或桥梁名称，我将查询关联的占挖项目分布情况。';
            initialActions = [{ label: '查询一环路南一段周边项目', value: 'query_map', type: 'button' }];
        }
        else if (agent.id === 'sup6') {
            greeting += '\n\n请选择月份和模板类型，我将为您自动生成监管月报。';
            initialActions = [{ label: '生成2月监管月报', value: 'gen_monthly_report', type: 'button' }];
        }
        else if (agent.id === 'sup7') {
            greeting += '\n\n请指定时间范围，我将对比分析占挖费用收支情况。';
            initialActions = [{ label: '分析2025年度费用收支', value: 'check_fee', type: 'button' }];
        }
        else if (agent.id === 'sup8') {
            greeting += '\n\n基于历史数据，我可以为您预测年末经费调整趋势。';
            initialActions = [{ label: '预测下季度经费趋势', value: 'predict_fee', type: 'button' }];
        }
        else if (agent.id === 'sup9') {
            greeting += '\n\n请输入项目列表，我将识别潜在的高/中/低风险项目。';
            initialActions = [{ label: '识别当前申报项目风险', value: 'identify_risk', type: 'button' }];
        }
        else if (agent.id === 'sup10') {
            greeting += '\n\n我可以帮您查询已移交设施关联的占挖项目历史。';
            initialActions = [{ label: '查询"红星路隧道"移交历史', value: 'query_transfer', type: 'button' }];
        }
        else if (agent.id === 'sup11') {
            greeting += '\n\n您可以查询项目的巡查完成情况，或获取未巡查预警列表。';
            initialActions = [{ label: '查询本周证后巡查情况', value: 'check_inspection', type: 'button' }];
        }

        // Information Agents
        else if (agent.id === 'inf1') {
            greeting += '\n\n接入地震局数据中... 如发生地震，我将自动生成快报。您也可以查询历史地震影响。';
            initialActions = [{ label: '生成最新地震应急快报', value: 'earthquake_report', type: 'button' }];
        }
        else if (agent.id === 'inf2') {
            greeting += '\n\n我可以提供局部气象预报，并在极端天气时提供应急抢险建议。';
            initialActions = [{ label: '查看暴雨预警及建议', value: 'weather_warning', type: 'button' }];
        }
        else if (agent.id === 'inf3') {
            greeting += '\n\n请提供审计维度或病害数据，我将进行深度关联分析与疑点排查。';
            initialActions = [{ label: '深度审计病害修复数据', value: 'audit_disease', type: 'button' }];
        }

        // Maintenance Agents
        else if (agent.id === 'mnt1') {
            greeting += '\n\n请输入设施编码或名称，查看“一设施一档案”全景视图。';
            initialActions = [{ label: '调取"二环路高架"档案', value: 'view_archive', type: 'button' }];
        }
        else if (agent.id === 'mnt2') {
            greeting += '\n\n我可以分析网络理政投诉数据，并关联维护单位进行考核评分。';
            initialActions = [{ label: '分析本月投诉热点', value: 'analyze_complaint', type: 'button' }];
        }
        else if (agent.id === 'mnt3') {
            greeting += '\n\n请上传或选择桥梁检测报告，我将分析病害年度变化趋势。';
            initialActions = [{ label: '分析2025年桥梁检测报告', value: 'analyze_report', type: 'button' }];
        }
        else if (agent.id === 'mnt4') {
            greeting += '\n\n我结合多因子为您排序病害处置优先级，请指定路段或范围。';
            initialActions = [{ label: '计算三环路维护优先级', value: 'calc_priority', type: 'button' }];
        }
        else if (agent.id === 'mnt5') {
            greeting += '\n\n基于预算和病害库，我可以为您推荐年度重点维修计划。';
            initialActions = [{ label: '推荐3月重点维护计划', value: 'recommend_plan', type: 'button' }];
        }
        else if (agent.id === 'mnt6') {
            greeting += '\n\n请选择报表类型（日报/月报/年报），我将自动生成维护统计文档。';
            initialActions = [{ label: '生成一季度维护统计报表', value: 'gen_mnt_report', type: 'button' }];
        }
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
          actions: initialActions,
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

    // --- Supervision Agents (督查科) ---

    // Sup1: 高风险企业画像
    if (effectiveAgentId === 'sup1') {
        if (content.includes('画像') || content.includes('信用') || actionValue === 'check_credit') {
            thinkingProcess = '1. 检索企业库：成都XX建设工程有限公司。\n2. 聚合数据：历史申报5次，行政处罚1次，区域问题台账3条。\n3. 计算信用分：78分 (B级)。\n4. 生成画像摘要。';
            responseContent = '已生成 **成都XX建设工程有限公司** 的企业画像：\n\n- **信用等级**: B级 (78分)\n- **风险标签**: #施工噪音投诉 #申报延期\n- **扣分项**: \n  1. 2025-01-15 违规夜间施工 (扣5分)\n  2. 2024-12-10 申报资料造假未遂 (扣10分)\n\n建议在审批该企业新项目时，重点审核其施工组织方案。';
            actions = [{ label: '查看详细扣分记录', value: 'view_deductions', type: 'button' }, { label: '导出信用报告', value: 'export_credit_report', type: 'button' }];
        } else {
            thinkingProcess = '等待查询指令...';
            responseContent = '请输入企业名称或统一社会信用代码，我将为您查询信用等级和风险画像。';
        }
    }
    // Sup2: 申报校核
    else if (effectiveAgentId === 'sup2') {
        if (content.includes('校核') || content.includes('申报') || actionValue === 'check_application') {
            thinkingProcess = '1. 读取申报单号：SQ-2026-03-005。\n2. 解析附件PDF：提取工程量清单。\n3. 比对系统数据：申报面积(50m²) vs 图纸计算面积(52m²)。\n4. 判定结果：基本一致(误差<5%)。';
            responseContent = '申报单 **SQ-2026-03-005** 校核完成：\n\n- **一致性判定**: ✅ 通过\n- **关键指标比对**：\n  - 挖掘长度：申报 100m / 图纸 100m\n  - 恢复面积：申报 50m² / 图纸 52m² (误差范围内)\n\n未发现明显逻辑漏洞，建议通过初审。';
            actions = [{ label: '通过初审', value: 'approve_first', type: 'button' }, { label: '查看差异详情', value: 'view_diff', type: 'button' }];
        } else {
            thinkingProcess = '准备校核...';
            responseContent = '请上传申报单号及PDF附件，我将为您校核资料一致性。';
        }
    }
    // Sup3: 项目全生命周期查询
    else if (effectiveAgentId === 'sup3') {
        if (content.includes('查询') || content.includes('进度') || actionValue === 'query_lifecycle') {
            thinkingProcess = '1. 索引：许可证号 2025-ZW-0012。\n2. 关联表：办证(已办)、缴费(已缴)、开工(2025-02-01)、验收(未验收)。\n3. 构建时间轴。';
            responseContent = '项目 **人民南路管线抢修工程 (2025-ZW-0012)** 全生命周期状态：\n\n- **当前阶段**: 施工中\n- **办证时间**: 2025-01-20 (正常)\n- **缴费情况**: 15,000元 (已到账)\n- **开工时间**: 2025-02-01\n- **计划完工**: 2025-02-15 (剩余 3 天)\n\n该项目存在一条“未佩戴安全帽”的巡查整改记录。';
            actions = [{ label: '查看巡查记录', value: 'view_inspection', type: 'button' }, { label: '查看缴费凭证', value: 'view_payment', type: 'button' }];
        } else {
            thinkingProcess = '准备查询...';
            responseContent = '请输入许可证编号或项目名称，查询全流程节点数据。';
        }
    }
    // Sup4: 多维度统计
    else if (effectiveAgentId === 'sup4') {
        if (content.includes('统计') || content.includes('报表') || actionValue === 'gen_stats') {
            thinkingProcess = '1. 解析维度：区域=锦江区，时间=本月，类型=占道施工。\n2. 聚合数据：总数 25 个，完工率 80%。\n3. 生成图表数据。';
            responseContent = '为您生成 **锦江区 3月占道施工统计报表**：\n\n- **项目总数**: 25 个\n- **按状态分布**：\n  - 施工中: 5 个 (20%)\n  - 已完工: 20 个 (80%)\n- **同比变化**: +12%\n\n主要集中在春熙路街道。';
            actions = [{ label: '查看详细清单', value: 'view_list', type: 'button' }, { label: '导出Excel', value: 'export_excel', type: 'button' }];
        } else {
            thinkingProcess = '等待统计指令...';
            responseContent = '请告诉我您想统计的维度（如区域、时间、类型），我将为您生成分析报表。';
        }
    }
    // Sup5: 设施撒点查询
    else if (effectiveAgentId === 'sup5') {
        if (content.includes('一环路') || content.includes('查询') || actionValue === 'query_map') {
            thinkingProcess = '1. 空间检索：一环路南一段。\n2. 筛选项目：关联占挖项目 5 个。\n3. 分类统计：正常施工 3 个，超期 1 个，未办证 1 个。';
            responseContent = '**一环路南一段** 当前关联占挖项目共 **5** 个：\n\n- 🟢 **正常施工**: 3 个\n- 🔴 **超期未完工**: 1 个 (电力管网改造)\n- 🟠 **疑似未办证**: 1 个 (人行道开挖)\n\n已在地图上为您撒点展示。';
            actions = [{ label: '查看超期项目详情', value: 'view_overdue', type: 'button' }, { label: '查看地图分布', value: 'view_map', type: 'button' }];
        } else {
            thinkingProcess = '等待位置信息...';
            responseContent = '请输入道路或桥梁名称（如“一环路”），我将查询该设施下的占挖项目分布。';
        }
    }
    // Sup6: 月报生成
    else if (effectiveAgentId === 'sup6') {
        if (content.includes('月报') || content.includes('生成') || actionValue === 'gen_monthly_report') {
            thinkingProcess = '1. 归集数据：2026年2月。\n2. 统计指标：新增项目 120 个，完工 110 个，投诉 5 起。\n3. 填充模板：标准监管月报模板。\n4. 生成Word文档。';
            responseContent = '已生成 **2026年2月占道施工监管月报**：\n\n**核心数据**：\n- **新增审批**: 120 件 (环比 +5%)\n- **按期完工率**: 98%\n- **违规查处**: 3 起 (主要为围挡不规范)\n\n文档已准备就绪。';
            actions = [{ label: '预览文档', value: 'preview_doc', type: 'button' }, { label: '发送至邮箱', value: 'send_email', type: 'button' }];
        } else {
            thinkingProcess = '准备生成...';
            responseContent = '请选择月份和模板类型，我将为您自动生成监管月报。';
        }
    }
    // Sup7: 费用管理
    else if (effectiveAgentId === 'sup7') {
        if (content.includes('费用') || content.includes('欠费') || actionValue === 'check_fee') {
            thinkingProcess = '1. 查询台账：2025年度。\n2. 统计收支：应收 500万，实收 480万。\n3. 筛选欠费：欠费单位 3 家，总额 20万。';
            responseContent = '2025年度占道挖掘费收支情况如下：\n\n- **应收总额**: 500.00 万元\n- **实收总额**: 480.00 万元 (收缴率 96%)\n- **欠费金额**: 20.00 万元\n\n主要欠费单位为 **某通信公司** (15万元)。';
            actions = [{ label: '生成催缴通知单', value: 'gen_dunning', type: 'button' }, { label: '查看欠费明细', value: 'view_arrears', type: 'button' }];
        } else {
            thinkingProcess = '等待指令...';
            responseContent = '请指定时间范围，我将对比分析占挖费用收支情况。';
        }
    }
    // Sup8: 费用预测
    else if (effectiveAgentId === 'sup8') {
        if (content.includes('预测') || content.includes('趋势') || actionValue === 'predict_fee') {
            thinkingProcess = '1. 加载模型：ARIMA 时间序列模型。\n2. 输入历史数据：过去 3 年月度收入。\n3. 预测未来：2026年 Q2 预计收入 150万。';
            responseContent = '基于历史数据预测，**2026年第二季度** 占挖费收入趋势如下：\n\n- **预计总收入**: 150 万元 (同比增长 8%)\n- **高峰月份**: 5月 (预计 60 万元)\n\n建议提前做好资金入库安排。';
            actions = [{ label: '查看趋势图', value: 'view_trend', type: 'button' }, { label: '调整预测参数', value: 'adjust_model', type: 'button' }];
        } else {
            thinkingProcess = '准备建模...';
            responseContent = '基于历史数据，我可以为您预测年末经费调整趋势。';
        }
    }
    // Sup9: 项目风险识别
    else if (effectiveAgentId === 'sup9') {
        if (content.includes('风险') || content.includes('识别') || actionValue === 'identify_risk') {
            thinkingProcess = '1. 获取项目参数：深基坑(>5m)、工期紧(3天)、交通繁忙路段。\n2. 规则引擎匹配：R3级高风险。\n3. 生成风险清单。';
            responseContent = '经分析，该项目属于 **高风险 (R3级)**，主要风险点如下：\n\n1. **深基坑作业**: 开挖深度 5.5m，存在塌方风险。\n2. **交通影响**: 位于主干道高峰期施工，拥堵指数预测 > 8.0。\n3. **管线复杂**: 施工区域地下涉及燃气与光缆。\n\n建议组织专家评审施工方案。';
            actions = [{ label: '下载风险清单', value: 'download_risk_list', type: 'button' }, { label: '查看专家评审建议', value: 'view_expert_advice', type: 'button' }];
        } else {
            thinkingProcess = '准备风险评估...';
            responseContent = '请提供项目列表或详细参数，我将为您识别潜在风险等级。';
        }
    }
    // Sup10: 移交设施查询
    else if (effectiveAgentId === 'sup10') {
        if (content.includes('移交') || content.includes('历史') || actionValue === 'query_transfer') {
            thinkingProcess = '1. 检索设施：红星路下穿隧道。\n2. 关联历史：2020年移交，2023年改造。\n3. 提取占挖记录：共 5 次。';
            responseContent = '设施 **红星路下穿隧道** (移交日期: 2020-05-01) 关联占挖历史：\n\n- **2023-08**: 排水管网改造 (已完工)\n- **2021-12**: 监控设备安装 (已完工)\n\n该设施目前处于质保期外。';
            actions = [{ label: '查看移交清单', value: 'view_transfer_list', type: 'button' }, { label: '查看质保协议', value: 'view_warranty', type: 'button' }];
        } else {
            thinkingProcess = '正在查询移交库...';
            responseContent = '我可以帮您查询已移交设施关联的占挖项目历史。';
        }
    }
    // Sup11: 证后巡查监管
    else if (effectiveAgentId === 'sup11') {
        if (content.includes('巡查') || content.includes('未巡查') || actionValue === 'check_inspection') {
            thinkingProcess = '1. 筛选项目：已办证且在建项目 50 个。\n2. 匹配巡查记录：本周已巡查 45 个。\n3. 生成预警：5 个项目超 7 天未巡查。';
            responseContent = '本周巡查监管情况：\n\n- **应巡查**: 50 个\n- **已巡查**: 45 个 (覆盖率 90%)\n- **⚠️ 预警**: 5 个项目超过 7 天未巡查。\n\n建议优先安排对 **二环路东段电力改造** 项目的巡查。';
            actions = [{ label: '查看未巡查名单', value: 'view_uninspected', type: 'button' }, { label: '一键派单', value: 'dispatch_inspection', type: 'button' }];
        } else {
            thinkingProcess = '监听监管动态...';
            responseContent = '您可以查询项目的巡查完成情况，或获取未巡查预警列表。';
        }
    }

    // --- Information Agents (信息科) ---

    // Inf1: 地震应急智能分析
    else if (effectiveAgentId === 'inf1') {
        if (content.includes('地震') || content.includes('快报') || actionValue === 'earthquake_report') {
            thinkingProcess = '1. 接入地震台网API：四川泸定 6.8级。\n2. 空间分析：成都市震感强烈，烈度 5度。\n3. 筛选桥梁：震区范围内重点桥梁 12 座。\n4. 健康监测数据：K45+200 特大桥振幅正常。';
            responseContent = '【地震快报】\n\n**震源**: 四川泸定 (6.8级)\n**本地影响**: 成都市区震感强烈，预估烈度 5 度。\n\n**重点设施评估**：\n- 监测范围内 **12** 座重点桥梁传感器数据正常。\n- **K45+200 特大桥**：振幅 0.02g (安全范围内)。\n\n建议启动 III 级应急响应，对老旧桥梁进行人工排查。';
            actions = [{ label: '启动应急响应', value: 'start_emergency', type: 'button' }, { label: '下发排查任务', value: 'dispatch_check', type: 'button' }];
        } else {
            thinkingProcess = '监听地震数据...';
            responseContent = '地震监测系统运行中。如发生地震，我将自动生成快报。您也可以询问“最近一次地震影响”。';
        }
    }
    // Inf2: 气象预报与指导
    else if (effectiveAgentId === 'inf2') {
        if (content.includes('暴雨') || content.includes('天气') || actionValue === 'weather_warning') {
            thinkingProcess = '1. 获取气象API：未来 2 小时金牛区有强降水 (50mm/h)。\n2. 识别风险点：下穿隧道 3 处，低洼路段 5 处。\n3. 生成建议：启动防汛泵站。';
            responseContent = '⚠️ **暴雨黄色预警**\n\n预计未来 2 小时，金牛区、青羊区将出现强降水，小时雨强可达 50mm。\n\n**重点关注区域**：\n1. **羊西线下穿隧道** (积水风险高)\n2. **一环路北一段** (低洼路段)\n\n**处置建议**：\n建议立即启动防汛泵站预排，并安排人员值守下穿隧道。';
            actions = [{ label: '查看积水点监控', value: 'view_flood_cam', type: 'button' }, { label: '通知养护单位', value: 'notify_maintenance', type: 'button' }];
        } else {
            thinkingProcess = '同步气象数据...';
            responseContent = '我可以为您提供局部气象预报及极端天气下的应急抢险建议。';
        }
    }
    // Inf3: 病害深度分析与审计
    else if (effectiveAgentId === 'inf3') {
        if (content.includes('审计') || content.includes('分析') || actionValue === 'audit_disease') {
            thinkingProcess = '1. 提取数据：2025年病害记录 5000 条。\n2. 关联分析：修复后再次损坏率 5%。\n3. 识别疑点：某施工单位负责路段复发率偏高。';
            responseContent = '经深度审计分析：\n\n- **总体修复合格率**: 95%\n- **异常发现**: **XX路桥公司** 负责的沥青路面修补项目，半年内复发率达 15% (均值 5%)。\n\n建议对该公司近期施工质量进行专项核查。';
            actions = [{ label: '生成审计报告', value: 'gen_audit_report', type: 'button' }, { label: '发起专项核查', value: 'start_special_check', type: 'button' }];
        } else {
            thinkingProcess = '准备审计...';
            responseContent = '请提供审计维度或病害数据，我将进行深度关联分析与疑点排查。';
        }
    }

    // --- Maintenance Agents (维护科) ---

    // Mnt1: 全生命周期档案
    else if (effectiveAgentId === 'mnt1') {
        if (content.includes('档案') || content.includes('二环路高架') || actionValue === 'view_archive') {
            thinkingProcess = '1. 检索对象：二环路高架桥 (ID: BR-02-001)。\n2. 归集数据：设计图(2012)、竣工验收(2013)、历年检测报告(10份)、维修记录(58条)。\n3. 生成视图。';
            responseContent = '已调取 **二环路高架桥 (BR-02-001)** 全生命周期档案：\n\n- **建设期**: 2012年设计，2013年竣工。\n- **技术状况**: B级 (2025年检测)。\n- **核心资料**：\n  - 竣工图纸 (PDF, 1.2GB)\n  - 2025年定期检测报告\n  - 2024年伸缩缝更换记录\n\n您需要查看哪部分详细资料？';
            actions = [{ label: '查看检测报告', value: 'view_report', type: 'button' }, { label: '查看维修记录', value: 'view_maintenance', type: 'button' }];
        } else {
            thinkingProcess = '准备调档...';
            responseContent = '请输入设施编码或名称，我将为您展示该设施的设计、建设、检测及维护全过程档案。';
        }
    }
    // Mnt2: 病害投诉分析与考核
    else if (effectiveAgentId === 'mnt2') {
        if (content.includes('投诉') || content.includes('考核') || actionValue === 'analyze_complaint') {
            thinkingProcess = '1. 接入网络理政平台：本月投诉 30 件。\n2. 归类分析：井盖异响 15 件，路面坑槽 10 件。\n3. 关联单位：第一养护段 (投诉率上升 5%)。';
            responseContent = '本月网络理政投诉分析：\n\n- **投诉总量**: 30 件\n- **高频问题**: 井盖异响 (占比 50%)\n- **考核扣分**: 第一养护段因响应不及时扣 2 分。\n\n建议约谈第一养护段负责人。';
            actions = [{ label: '生成考核通报', value: 'gen_assessment', type: 'button' }, { label: '查看投诉详情', value: 'view_complaint_detail', type: 'button' }];
        } else {
            thinkingProcess = '正在分析投诉数据...';
            responseContent = '我可以分析网络理政投诉数据，并关联维护单位进行考核评分。';
        }
    }
    // Mnt3: 检测报告分析
    else if (effectiveAgentId === 'mnt3') {
        if (content.includes('报告') || content.includes('检测') || actionValue === 'analyze_report') {
            thinkingProcess = '1. 读取报告：2025年桥梁定检报告。\n2. 对比历史：2024年评定 92分 -> 2025年 88分。\n3. 识别退化：支座老化速度加快。';
            responseContent = '检测报告对比分析结果：\n\n- **评分变化**: 92分 (2024) 📉 88分 (2025)\n- **主要退化构件**: 橡胶支座 (老化等级由 B 降为 C)\n\n建议将支座更换纳入明年专项计划。';
            actions = [{ label: '查看退化曲线', value: 'view_degradation', type: 'button' }, { label: '加入维修库', value: 'add_to_repair_db', type: 'button' }];
        } else {
            thinkingProcess = '准备分析...';
            responseContent = '请上传或选择桥梁检测报告，我将分析病害年度变化趋势。';
        }
    }
    // Mnt4: 病害维护优先级
    else if (effectiveAgentId === 'mnt4') {
        if (content.includes('优先级') || content.includes('排序') || actionValue === 'calc_priority') {
            thinkingProcess = '1. 扫描区域：三环路全线。\n2. 提取病害：共 120 处。\n3. 因子加权：类型(权重0.4) + 等级(0.3) + 投诉频次(0.2) + 位置(0.1)。\n4. 排序输出。';
            responseContent = '经智能算法排序，**三环路** 当前待处置病害优先级如下：\n\n1. **[P1-极高]** 主路 K12+500 坑槽 (深10cm，投诉3次)\n2. **[P1-极高]** 辅道 K15+200 井盖缺失 (安全隐患)\n3. **[P2-高]** 蓝天立交匝道 网状裂缝 (面积大)\n\n建议优先处置 P1 级病害。';
            actions = [{ label: '生成派单计划', value: 'create_dispatch_plan', type: 'button' }, { label: '查看地图分布', value: 'view_priority_map', type: 'button' }];
        } else {
            thinkingProcess = '等待指令...';
            responseContent = '请指定路段或区域，我将结合病害等级和投诉频次为您生成维护优先级列表。';
        }
    }
    // Mnt5: 维护计划推荐
    else if (effectiveAgentId === 'mnt5') {
        if (content.includes('计划') || content.includes('推荐') || actionValue === 'recommend_plan') {
            thinkingProcess = '1. 分析预算：年度剩余预算 500万。\n2. 分析病害库：存量病害 2000 处。\n3. 策略优化：优先处理主干道重度病害。\n4. 生成推荐方案。';
            responseContent = '基于当前预算与病害分布，为您推荐 **2026年3月重点维护计划**：\n\n1. **重点路段**: 蜀都大道西段 (病害密度高，需集中整治)。\n2. **专项行动**: 全市雨水篦子清淤 (应对汛期)。\n3. **预防性养护**: 三环路辅道微表处 (5km)。\n\n预计预算执行率 12%，是否生成详细方案？';
            actions = [{ label: '生成详细方案', value: 'gen_detail_plan', type: 'button' }, { label: '调整预算约束', value: 'adjust_budget', type: 'button' }];
        } else {
            thinkingProcess = '准备规划...';
            responseContent = '我可以基于历史数据和预算约束，为您推荐月度或年度维护计划。';
        }
    }
    // Mnt6: 多维度统计报表
    else if (effectiveAgentId === 'mnt6') {
        if (content.includes('报表') || content.includes('统计') || actionValue === 'gen_mnt_report') {
            thinkingProcess = '1. 归集数据：2026年 Q1。\n2. 统计维度：维修面积 5000m²，费用 200万。\n3. 生成图表：费用占比饼图。';
            responseContent = '2026年第一季度维护统计报表：\n\n- **维修总面积**: 5,000 m²\n- **总费用**: 200.00 万元\n- **费用构成**：\n  - 沥青路面: 60%\n  - 人行道: 25%\n  - 附属设施: 15%\n\n报表已生成。';
            actions = [{ label: '导出PDF', value: 'export_pdf', type: 'button' }, { label: '查看明细', value: 'view_detail', type: 'button' }];
        } else {
            thinkingProcess = '等待统计指令...';
            responseContent = '请选择报表类型（日报/月报/年报），我将自动生成维护统计文档。';
        }
    }

    // Fallback for other agents or generic queries
    else {
        thinkingProcess = '正在理解用户意图...\n检索专业知识库...';
        responseContent = `收到您的消息：“${content}”。\n\n作为${MOCK_AGENTS.find(a => a.id === effectiveAgentId)?.name || '智能助手'}，我可以为您提供该领域的专业支持。`;
        
        // Add generic actions based on agent type if needed
        if (effectiveAgentId?.startsWith('sup')) {
             actions = [{ label: '查看监管报表', value: 'view_sup_report', type: 'button' }];
        } else if (effectiveAgentId?.startsWith('inf')) {
             actions = [{ label: '查看监测数据', value: 'view_monitor_data', type: 'button' }];
        } else if (effectiveAgentId?.startsWith('mnt')) {
             actions = [{ label: '查看维护记录', value: 'view_mnt_record', type: 'button' }];
        }
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
