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
            initialActions = [
                { label: '查询"成都XX建设"信用画像', value: 'check_credit', type: 'button' },
                { label: '导出信用报告', value: 'export_credit_report', type: 'button' }
            ];
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
            initialActions = [
                { label: '生成最新地震应急快报', value: 'earthquake_report', type: 'button' },
                { label: '查询历史地震影响', value: 'query_history', type: 'button' }
            ];
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
            initialActions = [
                { label: '推荐3月重点维护计划', value: 'recommend_plan', type: 'button' },
                { label: '调整预算约束', value: 'adjust_budget', type: 'button' }
            ];
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
        } else if (actionValue === 'view_deductions') {
            thinkingProcess = '1. 查询扣分明细表。\n2. 过滤该企业ID。\n3. 按时间倒序排列。';
            responseContent = '**成都XX建设工程有限公司** 近期扣分记录如下：\n\n1. **2025-01-15** | 违规夜间施工 | -5分 | 状态：已确认\n2. **2024-12-10** | 申报资料造假未遂 | -10分 | 状态：已确认\n3. **2024-11-05** | 围挡不规范 | -2分 | 状态：已整改\n\n您可查看具体违规证据或发起申诉。';
            actions = [{ label: '查看违规证据(2025-01-15)', value: 'view_evidence_0115', type: 'button' }, { label: '发起申诉', value: 'start_appeal', type: 'button' }];
        } else if (actionValue === 'view_evidence_0115') {
            thinkingProcess = '1. 调取执法记录仪数据。\n2. 截取关键帧。\n3. 关联噪音监测数据(75dB)。';
            responseContent = '已调取 **2025-01-15 违规夜间施工** 证据材料：\n\n- **现场照片**: [施工现场.jpg] (显示时间 23:45)\n- **噪音监测值**: 75dB (限值 55dB)\n- **执法记录**: 现场负责人无法提供夜间施工许可证。\n\n证据链完整，判定无误。';
            actions = [{ label: '下载证据包', value: 'download_evidence', type: 'button' }, { label: '返回画像', value: 'check_credit', type: 'button' }];
        } else if (actionValue === 'export_credit_report') {
            thinkingProcess = '1. 生成PDF报告。\n2. 加盖电子签章。\n3. 生成下载链接。';
            responseContent = '信用报告已生成：**成都XX建设_信用报告_202603.pdf** (1.2MB)\n\n报告包含企业基本信息、信用评分趋势、详细扣分记录及整改情况。';
            actions = [{ label: '发送至邮箱', value: 'send_email_report', type: 'button' }, { label: '直接下载', value: 'download_report', type: 'button' }];
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
        } else if (actionValue === 'view_diff') {
            thinkingProcess = '1. 定位差异点。\n2. 生成对比表格。\n3. 高亮显示恢复面积差异。';
            responseContent = '差异详情分析：\n\n| 项目 | 申报值 | 图纸计算值 | 差异 |\n|---|---|---|---|\n| 挖掘长度 | 100m | 100m | 0 |\n| **恢复面积** | **50m²** | **52m²** | **-2m²** |\n\n差异原因分析：图纸包含了两处窨井盖周边的加固面积，申报时未计算。差异在允许范围内。';
            actions = [{ label: '确认并忽略差异', value: 'confirm_diff', type: 'button' }, { label: '退回修正', value: 'reject_application', type: 'button' }];
        } else if (actionValue === 'confirm_diff') {
            thinkingProcess = '1. 记录忽略差异操作。\n2. 更新审核状态。\n3. 准备进入下一环节。';
            responseContent = '已确认并忽略微小差异。该申报单目前状态符合初审通过条件。';
            actions = [{ label: '执行初审通过', value: 'approve_first', type: 'button' }];
        } else if (actionValue === 'approve_first') {
            thinkingProcess = '1. 更新数据库状态：初审通过。\n2. 发送通知给申请人。\n3. 生成受理回执。';
            responseContent = '✅ **初审已通过**\n\n申报单 SQ-2026-03-005 已进入复审阶段。系统已自动发送短信通知申请人。';
            actions = [{ label: '打印受理回执', value: 'print_receipt', type: 'button' }, { label: '校核下一单', value: 'check_next', type: 'button' }];
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
        } else if (actionValue === 'view_inspection') {
            thinkingProcess = '1. 查询巡查监管库。\n2. 提取整改通知书。\n3. 获取整改前后照片。';
            responseContent = '巡查记录详情 (2025-02-05)：\n\n- **问题描述**: 现场两名工人未佩戴安全帽。\n- **整改要求**: 立即整改，并罚款 500 元。\n- **整改状态**: 已整改 (2025-02-06 复查通过)。';
            actions = [{ label: '查看整改照片', value: 'view_rectification', type: 'button' }, { label: '返回项目概览', value: 'query_lifecycle', type: 'button' }];
        } else if (actionValue === 'view_rectification') {
            thinkingProcess = '1. 加载图片资源。\n2. 生成对比视图。';
            responseContent = '整改前后对比：\n\n- **整改前**: [照片1.jpg] (工人未戴帽)\n- **整改后**: [照片2.jpg] (工人规范佩戴安全帽，现场设置安全警示牌)\n\n整改符合要求。';
            actions = [{ label: '下载整改报告', value: 'download_rectification', type: 'button' }];
        } else if (actionValue === 'view_payment') {
            thinkingProcess = '1. 查询财务系统。\n2. 提取电子发票。';
            responseContent = '缴费凭证信息：\n\n- **缴费金额**: 15,000.00 元\n- **缴费时间**: 2025-01-22 10:30:00\n- **发票代码**: 051001900xxx\n- **支付方式**: 对公转账';
            actions = [{ label: '下载电子发票', value: 'download_invoice', type: 'button' }];
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
        } else if (actionValue === 'view_list') {
            thinkingProcess = '1. 查询项目列表。\n2. 筛选锦江区、3月。\n3. 分页显示前5条。';
            responseContent = '锦江区 3月占道施工项目清单 (前5条)：\n\n1. **红星路管网改造** (施工中)\n2. **东大街电力抢修** (已完工)\n3. **总府路燃气接入** (已完工)\n4. **春熙路光纤铺设** (施工中)\n5. **大慈寺路路面恢复** (已完工)\n\n点击项目名称可查看详情。';
            actions = [{ label: '查看"红星路管网改造"详情', value: 'view_project_detail', type: 'button' }, { label: '查看更多', value: 'view_more_list', type: 'button' }];
        } else if (actionValue === 'view_project_detail') {
            thinkingProcess = '1. 获取项目详情。\n2. 提取关键字段。';
            responseContent = '**红星路管网改造** 项目详情：\n\n- **建设单位**: 成都水务集团\n- **施工单位**: XX市政工程公司\n- **占道面积**: 120m²\n- **工期**: 2026-03-01 至 2026-03-20\n- **当前进度**: 45% (管道铺设中)';
            actions = [{ label: '查看施工日志', value: 'view_logs', type: 'button' }, { label: '返回列表', value: 'view_list', type: 'button' }];
        } else if (actionValue === 'export_excel') {
            thinkingProcess = '1. 生成Excel文件。\n2. 打包下载链接。';
            responseContent = '统计报表已导出：**锦江区_3月_占道统计.xlsx** (45KB)\n\n包含项目基础信息、审批状态、施工进度等 15 个字段。';
            actions = [{ label: '发送至邮箱', value: 'send_email_excel', type: 'button' }];
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
        } else if (actionValue === 'view_overdue') {
            thinkingProcess = '1. 筛选超期项目。\n2. 计算超期天数。\n3. 关联施工单位。';
            responseContent = '超期项目详情：\n\n- **项目名称**: 一环路南一段电力管网改造\n- **施工单位**: XX电力工程公司\n- **计划完工**: 2026-02-28\n- **当前状态**: 仍在围挡施工 (超期 4 天)\n\n建议立即督促整改。';
            actions = [{ label: '查看施工单位信息', value: 'view_contractor', type: 'button' }, { label: '发送催办通知', value: 'urge_construction', type: 'button' }];
        } else if (actionValue === 'view_contractor') {
            thinkingProcess = '1. 查询企业库。\n2. 获取联系人信息。';
            responseContent = '**XX电力工程公司**\n\n- **资质等级**: 电力工程施工总承包二级\n- **项目负责人**: 李四 (139xxxx8888)\n- **历史信用**: B级\n\n该单位本年度已有 2 次超期记录。';
            actions = [{ label: '拨打负责人电话', value: 'call_leader', type: 'button' }, { label: '记录不良行为', value: 'record_bad_behavior', type: 'button' }];
        } else if (actionValue === 'urge_construction') {
            thinkingProcess = '1. 生成催办函。\n2. 发送短信/APP推送。';
            responseContent = '已向 **XX电力工程公司** 发送催办通知。\n\n内容：“贵单位承建的一环路南一段电力管网改造项目已超期，请立即加快施工进度并提交延期说明。”';
            actions = [{ label: '查看发送记录', value: 'view_msg_log', type: 'button' }];
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
        } else if (actionValue === 'preview_doc') {
            thinkingProcess = '1. 转换文档格式为HTML。\n2. 渲染预览视图。';
            responseContent = '**2026年2月占道施工监管月报 (预览)**\n\n一、总体情况\n本月全市共审批占道施工项目 120 件...\n\n二、主要问题\n1. 部分项目围挡设置不规范...\n\n(点击下方按钮可编辑或发送)';
            actions = [{ label: '编辑内容', value: 'edit_report', type: 'button' }, { label: '确认并发送', value: 'send_email', type: 'button' }];
        } else if (actionValue === 'edit_report') {
            thinkingProcess = '1. 进入编辑模式。\n2. 加载段落数据。';
            responseContent = '已进入编辑模式。请直接输入您想修改的段落内容，或点击“完成编辑”。';
            actions = [{ label: '完成编辑', value: 'finish_edit', type: 'button' }];
        } else if (actionValue === 'finish_edit') {
            thinkingProcess = '1. 保存修改。\n2. 重新生成文档。';
            responseContent = '修改已保存。文档已更新。';
            actions = [{ label: '预览文档', value: 'preview_doc', type: 'button' }, { label: '发送至邮箱', value: 'send_email', type: 'button' }];
        } else if (actionValue === 'send_email') {
            thinkingProcess = '1. 获取收件人列表。\n2. 发送邮件。';
            responseContent = '邮件已发送至 **admin@cd-transport.gov.cn** 等 5 位收件人。';
            actions = [{ label: '查看发送日志', value: 'view_email_log', type: 'button' }];
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
        } else if (actionValue === 'view_arrears') {
            thinkingProcess = '1. 提取欠费清单。\n2. 按金额排序。';
            responseContent = '欠费单位清单：\n\n1. **某通信公司**: 15.00 万元 (逾期 30 天)\n2. **XX置业公司**: 3.00 万元 (逾期 15 天)\n3. **XX燃气公司**: 2.00 万元 (逾期 5 天)';
            actions = [{ label: '查看某通信公司详情', value: 'view_company_arrear', type: 'button' }, { label: '一键生成所有催缴单', value: 'gen_all_dunning', type: 'button' }];
        } else if (actionValue === 'view_company_arrear') {
            thinkingProcess = '1. 查询该单位历史缴费记录。\n2. 分析欠费原因。';
            responseContent = '**某通信公司** 欠费详情：\n\n- **涉及项目**: 光纤入户工程 (3个)\n- **欠费原因**: 财务流程审批滞后\n- **联系人**: 王五 (138xxxx9999)\n\n建议发送正式催缴函。';
            actions = [{ label: '生成催缴函', value: 'gen_dunning', type: 'button' }, { label: '记录沟通情况', value: 'record_comm', type: 'button' }];
        } else if (actionValue === 'gen_dunning') {
            thinkingProcess = '1. 生成催缴函PDF。\n2. 盖章。';
            responseContent = '催缴通知单已生成：**催缴函_某通信公司_202603.pdf**\n\n请确认是否立即发送。';
            actions = [{ label: '确认发送', value: 'send_dunning', type: 'button' }, { label: '下载打印', value: 'print_dunning', type: 'button' }];
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
        } else if (actionValue === 'view_trend') {
            thinkingProcess = '1. 绘制折线图。\n2. 标注置信区间。';
            responseContent = '趋势图已生成 (见附件)。\n\n数据显示，5月份将迎来施工高峰期，预计收入将达到峰值。';
            actions = [{ label: '导出图表', value: 'export_prediction', type: 'button' }, { label: '分析增长原因', value: 'analyze_growth', type: 'button' }];
        } else if (actionValue === 'adjust_model') {
            thinkingProcess = '1. 显示可调参数。\n2. 等待用户输入。';
            responseContent = '您可以调整以下预测参数：\n\n1. **参考历史周期**: 默认3年\n2. **增长因子**: 默认1.05\n\n请输入新的参数值。';
            actions = [{ label: '设置为保守模式', value: 'set_conservative', type: 'button' }, { label: '设置为激进模式', value: 'set_aggressive', type: 'button' }];
        } else if (actionValue === 'export_prediction') {
            thinkingProcess = '1. 生成分析报告。\n2. 导出数据。';
            responseContent = '预测分析报告已导出。';
            actions = [{ label: '返回', value: 'predict_fee', type: 'button' }];
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
        } else if (actionValue === 'view_expert_advice') {
            thinkingProcess = '1. 检索专家库。\n2. 匹配类似项目建议。';
            responseContent = '专家评审建议库匹配结果：\n\n1. **基坑支护**: 建议采用钢板桩支护 + 降水措施。\n2. **交通疏解**: 建议夜间 22:00-06:00 施工，白天恢复路面。\n3. **管线保护**: 人工探坑，严禁机械盲目开挖。';
            actions = [{ label: '指派专家进行评审', value: 'assign_expert', type: 'button' }, { label: '生成整改方案', value: 'gen_rectification_plan', type: 'button' }];
        } else if (actionValue === 'assign_expert') {
            thinkingProcess = '1. 筛选土木工程专家。\n2. 发送邀请。';
            responseContent = '已向 **张教授 (西南交大)**、**李工 (市政院)** 发送评审邀请。';
            actions = [{ label: '查看邀请状态', value: 'view_invite_status', type: 'button' }];
        } else if (actionValue === 'download_risk_list') {
            thinkingProcess = '1. 生成清单文件。';
            responseContent = '风险清单已下载。';
            actions = [{ label: '返回', value: 'identify_risk', type: 'button' }];
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
        } else if (actionValue === 'view_transfer_list') {
            thinkingProcess = '1. 查询移交资产库。\n2. 显示设备列表。';
            responseContent = '移交清单包含：\n\n1. 隧道主体结构 (1.2km)\n2. 排水泵站 (2座)\n3. 照明系统 (500套)\n4. 监控摄像头 (20个)';
            actions = [{ label: '查看泵站详情', value: 'view_pump_detail', type: 'button' }, { label: '联系接收单位', value: 'contact_receiver', type: 'button' }];
        } else if (actionValue === 'view_warranty') {
            thinkingProcess = '1. 读取合同文件。\n2. 提取质保条款。';
            responseContent = '质保协议摘要：\n\n- **主体结构**: 50年\n- **防水工程**: 5年 (已到期)\n- **机电设备**: 2年 (已到期)';
            actions = [{ label: '查看原件', value: 'view_contract_origin', type: 'button' }];
        } else if (actionValue === 'contact_receiver') {
            thinkingProcess = '1. 查询通讯录。';
            responseContent = '接收单位：成都市道桥管理处\n联系人：赵六 (8888xxxx)';
            actions = [{ label: '拨打电话', value: 'call_receiver', type: 'button' }];
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
        } else if (actionValue === 'view_uninspected') {
            thinkingProcess = '1. 过滤未巡查项目。\n2. 按最后巡查时间排序。';
            responseContent = '未巡查项目清单 (Top 3)：\n\n1. **二环路东段电力改造** (上次巡查: 10天前)\n2. **建设北路燃气抢修** (上次巡查: 8天前)\n3. **府青路光纤迁改** (上次巡查: 8天前)';
            actions = [{ label: '派单给第一巡查组', value: 'dispatch_group1', type: 'button' }, { label: '查看项目详情', value: 'view_project_detail_sup11', type: 'button' }];
        } else if (actionValue === 'dispatch_inspection') {
            thinkingProcess = '1. 生成巡查任务。\n2. 推送至巡查APP。';
            responseContent = '已生成 5 个紧急巡查任务，并推送至 **巡查一组** 和 **巡查二组** 终端。';
            actions = [{ label: '跟踪任务状态', value: 'track_dispatch', type: 'button' }];
        } else if (actionValue === 'track_dispatch') {
            thinkingProcess = '1. 查询任务状态。';
            responseContent = '任务实时状态：\n\n- **二环路项目**: 巡查员已接单，正在前往...\n- **建设北路项目**: 待接单';
            actions = [{ label: '刷新状态', value: 'track_dispatch', type: 'button' }];
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
        } else if (actionValue === 'start_emergency') {
            thinkingProcess = '1. 激活应急预案。\n2. 生成指令列表。';
            responseContent = '已启动 **III 级应急响应**。\n\n自动执行以下操作：\n1. 通知应急指挥中心全员到岗。\n2. 调集无人机巡查编队。\n3. 开启桥梁健康监测高频模式。';
            actions = [{ label: '通知抢险队伍', value: 'notify_teams', type: 'button' }, { label: '查看疏散路线', value: 'view_evacuation', type: 'button' }];
        } else if (actionValue === 'notify_teams') {
            thinkingProcess = '1. 群发短信/语音。\n2. 确认接收状态。';
            responseContent = '已向 5 支抢险队伍发送集结指令。目前 3 支队伍已确认接收，预计 30 分钟内到达集结点。';
            actions = [{ label: '追踪队伍位置', value: 'track_teams', type: 'button' }, { label: '再次呼叫未响应队伍', value: 'recall_teams', type: 'button' }];
        } else if (actionValue === 'track_teams') {
            thinkingProcess = '1. 获取GPS定位。\n2. 渲染地图。';
            responseContent = '队伍实时位置已显示在地图上。\n\n- **第一梯队**: 距离震中 5km\n- **第二梯队**: 距离震中 12km';
            actions = [{ label: '查看现场视频回传', value: 'view_live_video', type: 'button' }];
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
        } else if (actionValue === 'view_flood_cam') {
            thinkingProcess = '1. 调取监控流。\n2. 图像识别积水深度。';
            responseContent = '已调取 **羊西线下穿隧道** 实时监控：\n\n- **当前积水深度**: 5cm (警戒值 20cm)\n- **泵站状态**: 运行中\n- **交通状况**: 通行正常';
            actions = [{ label: '调度移动抽水车', value: 'dispatch_pump', type: 'button' }, { label: '发布交通诱导', value: 'pub_traffic_guide', type: 'button' }];
        } else if (actionValue === 'dispatch_pump') {
            thinkingProcess = '1. 查询车辆位置。\n2. 规划路径。';
            responseContent = '建议调度 **2号移动抽水车** (距离 3km) 前往备勤。\n\n预计到达时间：15分钟。';
            actions = [{ label: '确认调度', value: 'confirm_dispatch', type: 'button' }];
        } else if (actionValue === 'confirm_dispatch') {
            thinkingProcess = '1. 下发调度指令。';
            responseContent = '调度指令已下发。司机已接单。';
            actions = [{ label: '返回概览', value: 'weather_warning', type: 'button' }];
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
        } else if (actionValue === 'start_special_check') {
            thinkingProcess = '1. 制定核查方案。\n2. 抽取样本点。';
            responseContent = '已生成专项核查方案：\n\n- **核查对象**: XX路桥公司\n- **抽样范围**: 过去 6 个月修复的 50 个点位\n- **核查方式**: 钻芯取样 + 平整度检测';
            actions = [{ label: '查看详细计划', value: 'view_check_plan', type: 'button' }, { label: '立即启动', value: 'approve_plan', type: 'button' }];
        } else if (actionValue === 'view_check_plan') {
            thinkingProcess = '1. 展示计划详情。';
            responseContent = '计划详情：\n\n1. 3月10日-12日：现场取样\n2. 3月13日：实验室检测\n3. 3月15日：出具核查报告';
            actions = [{ label: '批准执行', value: 'approve_plan', type: 'button' }];
        } else if (actionValue === 'approve_plan') {
            thinkingProcess = '1. 下发任务。';
            responseContent = '核查任务已下发至质监站。';
            actions = [{ label: '查看进度', value: 'view_check_progress', type: 'button' }];
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
        } else if (actionValue === 'view_report') {
            thinkingProcess = '1. 列表展示历年报告。\n2. 按年份倒序。';
            responseContent = '历年检测报告清单：\n\n1. **2025年定期检测报告** (BCI: 88.5)\n2. **2024年定期检测报告** (BCI: 90.2)\n3. **2023年特殊检测报告** (针对支座)';
            actions = [{ label: '查看2025报告详情', value: 'view_report_detail', type: 'button' }, { label: '对比历年评分', value: 'compare_score', type: 'button' }];
        } else if (actionValue === 'view_report_detail') {
            thinkingProcess = '1. 解析PDF内容。\n2. 提取病害统计。';
            responseContent = '**2025年定期检测报告** 摘要：\n\n- **检测单位**: 省交通院\n- **主要病害**: 伸缩缝止水带破损 (15处)、梁底裂缝 (5处)\n- **评定等级**: B级 (合格)\n\n建议对伸缩缝进行专项维修。';
            actions = [{ label: '下载完整报告', value: 'download_report', type: 'button' }, { label: '生成维修工单', value: 'create_work_order', type: 'button' }];
        } else if (actionValue === 'download_report') {
            thinkingProcess = '1. 生成下载链接。';
            responseContent = '报告已准备好：**二环路高架_2025定检.pdf** (15MB)';
            actions = [{ label: '返回档案', value: 'view_archive', type: 'button' }];
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
        } else if (actionValue === 'gen_assessment') {
            thinkingProcess = '1. 计算考核得分。\n2. 生成通报文档。';
            responseContent = '已生成 **3月份维护单位考核通报**：\n\n1. **第一养护段**: 85分 (扣分原因：投诉响应慢)\n2. **第二养护段**: 95分\n3. **第三养护段**: 92分';
            actions = [{ label: '查看扣分依据', value: 'view_deduction_rule', type: 'button' }, { label: '下发通报', value: 'send_assessment', type: 'button' }];
        } else if (actionValue === 'view_deduction_rule') {
            thinkingProcess = '1. 查询考核细则。';
            responseContent = '根据《成都市道桥维护考核办法》第12条：\n\n“接到市民投诉后，未在 24 小时内响应并处置的，每起扣 1 分。”\n\n第一养护段本月超时 2 起，共扣 2 分。';
            actions = [{ label: '确认并下发', value: 'send_assessment', type: 'button' }];
        } else if (actionValue === 'send_assessment') {
            thinkingProcess = '1. 发送至各单位OA。';
            responseContent = '考核通报已下发至各维护单位。';
            actions = [{ label: '查看签收状态', value: 'view_sign_status', type: 'button' }];
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
        } else if (actionValue === 'view_degradation') {
            thinkingProcess = '1. 拟合退化曲线。\n2. 预测剩余寿命。';
            responseContent = '橡胶支座退化趋势图已生成。\n\n按照当前退化速度，预计 **18个月** 后将达到 D 级 (不合格)，建议在 12个月内完成更换。';
            actions = [{ label: '生成维护建议书', value: 'gen_maintenance_suggestion', type: 'button' }];
        } else if (actionValue === 'gen_maintenance_suggestion') {
            thinkingProcess = '1. 匹配维护定额。\n2. 估算费用。';
            responseContent = '维护建议书：\n\n- **项目**: 全桥支座更换\n- **预估费用**: 120万元\n- **建议实施时间**: 2026年10月 (枯水期)';
            actions = [{ label: '导出建议书', value: 'export_suggestion', type: 'button' }];
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
        } else if (actionValue === 'create_dispatch_plan') {
            thinkingProcess = '1. 匹配维护班组。\n2. 估算工时。';
            responseContent = '派单计划草案：\n\n- **第一组**: 负责 P1 级坑槽修补 (预计 4小时)\n- **第二组**: 负责 P1 级井盖更换 (预计 2小时)\n\n是否确认派单？';
            actions = [{ label: '调整资源分配', value: 'adjust_resource', type: 'button' }, { label: '确认并派单', value: 'confirm_dispatch', type: 'button' }];
        } else if (actionValue === 'adjust_resource') {
            thinkingProcess = '1. 显示可用班组。';
            responseContent = '当前可用资源：\n\n- 第三组 (待命)\n- 机械队 (正在作业，预计2小时后空闲)\n\n您可以将第三组加入抢修。';
            actions = [{ label: '增加第三组', value: 'add_group3', type: 'button' }];
        } else if (actionValue === 'confirm_dispatch') {
            thinkingProcess = '1. 下发工单。';
            responseContent = '工单已下发。抢修工作预计在今天 18:00 前完成。';
            actions = [{ label: '监控维修进度', value: 'monitor_progress', type: 'button' }];
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
        } else if (actionValue === 'gen_detail_plan') {
            thinkingProcess = '1. 细化工程量。\n2. 套用定额。';
            responseContent = '详细方案已生成 (共 20 页)：\n\n- **蜀都大道整治**: 铣刨重铺 2000m²，预计 80万元。\n- **清淤行动**: 涉及 5000 个点位，预计 50万元。\n\n总计预算：130万元。';
            actions = [{ label: '查看预算明细', value: 'view_budget_breakdown', type: 'button' }, { label: '导出方案', value: 'export_plan', type: 'button' }];
        } else if (actionValue === 'view_budget_breakdown') {
            thinkingProcess = '1. 展示费用构成。';
            responseContent = '预算明细：\n\n- 材料费: 60%\n- 人工费: 25%\n- 机械费: 15%';
            actions = [{ label: '导出Excel', value: 'export_plan', type: 'button' }];
        } else if (actionValue === 'export_plan') {
            thinkingProcess = '1. 打包文件。';
            responseContent = '计划书已导出：**2026年3月维护计划.zip**';
            actions = [{ label: '返回', value: 'recommend_plan', type: 'button' }];
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
        } else if (actionValue === 'view_detail') {
            thinkingProcess = '1. 展示明细表。';
            responseContent = '明细数据 (前5条)：\n\n1. 一环路修补 - 50m² - 2万元\n2. 二环路更换井盖 - 10套 - 1万元\n...';
            actions = [{ label: '按区域筛选', value: 'filter_area', type: 'button' }, { label: '导出Excel', value: 'export_pdf', type: 'button' }];
        } else if (actionValue === 'filter_area') {
            thinkingProcess = '1. 筛选锦江区数据。';
            responseContent = '锦江区维护数据：\n\n- 总费用: 50万元\n- 主要类型: 人行道修复';
            actions = [{ label: '导出本区报表', value: 'export_pdf', type: 'button' }];
        } else if (actionValue === 'export_pdf') {
            thinkingProcess = '1. 生成文件。';
            responseContent = '报表已下载。';
            actions = [{ label: '返回', value: 'gen_mnt_report', type: 'button' }];
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
