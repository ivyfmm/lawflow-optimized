// ============================================================
// LawFlow AI - 法律护盾增强模块 v2.0
// 法律人逻辑：风险定级→工具匹配→方案生成→文书输出
// ============================================================

(function() {
  'use strict';

  // --------------------------------------------------------
  // 1. 法律工具库（按制裁类型分类）
  // 每条记录：适用条件、法律依据、操作步骤、风险提示
  // --------------------------------------------------------
  const LEGAL_TOOLS = {
    // === 一级制裁应对（美国全面/部门制裁） ===
    primarySanctions: {
      category: "一级制裁应对",
      description: "美国法律直接禁止美国人/美国境内/美元结算与制裁对象交易",
      tools: [
        {
          id: "PS-1",
          name: "阻断法令适用（中国《反外国制裁法》第12条）",
          applicableWhen: ["comprehensive", "sectoral"],
          applicableCountries: ["CN"],
          legalBasis: "《中华人民共和国反外国制裁法》第12条、《阻断外国法律与措施不当域外适用办法》",
          steps: [
            "向商务部提交「禁止遵守外国制裁令」申请",
            "获取「不得承认/执行/遵守外国制裁」的豁免令",
            "书面通知交易对手：依据中国阻断法令继续履行合同",
            "保留所有证据：阻断令副本、通知函、对方回复"
          ],
          riskWarning: "阻断法令仅保护中国境内实体，海外子公司仍需评估当地法律冲突",
          templates: ["阻断令申请书", "继续履行通知函", "合规声明"],
          successRate: "中",
          timeFrame: "30-60天"
        },
        {
          id: "PS-2",
          name: "合同不可抗力/制裁条款援引",
          applicableWhen: ["comprehensive", "sectoral"],
          applicableCountries: ["ALL"],
          legalBasis: "《民法典》第180条（不可抗力）、《民法典》第533条（情势变更）",
          steps: [
            "审查合同中的制裁条款、不可抗力条款、法律变更条款",
            "确认制裁是否构成「不可抗力」或「情势变更」",
            "在合理期限内向对方发出书面通知",
            "协商合同变更（暂停、终止、替代履行）"
          ],
          riskWarning: "并非所有制裁都构成不可抗力，需具体论证因果关系",
          templates: ["不可抗力通知函", "合同变更协议", "终止协议"],
          successRate: "高",
          timeFrame: "7-30天"
        },
        {
          id: "PS-3",
          name: "替代交易架构（非美元+非美国主体）",
          applicableWhen: ["comprehensive", "sectoral"],
          applicableCountries: ["ALL"],
          legalBasis: "国际私法冲突规范、合同自由原则",
          steps: [
            "设立非美国关联公司（香港/新加坡/迪拜）作为交易主体",
            "使用人民币/欧元/本币结算，避开美元清算",
            "通过非SWIFT渠道（CIPS、银企直连、数字货币）支付",
            "确保产品不含美国技术成分（de minimis <25%）",
            "交易合同适用中国法/英国法/新加坡法"
          ],
          riskWarning: "需穿透审查最终受益人，避免被认定为「规避制裁」",
          templates: ["交易架构方案", "关联公司授权书", "合同范本"],
          successRate: "中高",
          timeFrame: "60-90天"
        },
        {
          id: "PS-4",
          name: "OFAC许可证申请（特定交易豁免）",
          applicableWhen: ["comprehensive", "sectoral"],
          applicableCountries: ["ALL"],
          legalBasis: "31 CFR 501（OFAC许可制度）、EO 13850/13902/14024",
          steps: [
            "确定适用的制裁项目（Iran/Russia/Venezuela等）",
            "确认交易是否符合通用许可（General License）范围",
            "如不在通用许可范围，准备特定许可申请（Specific License）",
            "提交申请至OFAC，等待90-180天审查",
            "获批后方可执行交易"
          ],
          riskWarning: "审批周期长，通过率因项目而异；人道主义/医疗/农产品通过率较高",
          templates: ["OFAC特定许可申请表", "交易说明备忘录", "合规承诺函"],
          successRate: "低中",
          timeFrame: "90-180天"
        },
        {
          id: "PS-5",
          name: "人道主义/食品/药品豁免路径",
          applicableWhen: ["comprehensive"],
          applicableCountries: ["ALL"],
          legalBasis: "31 CFR 501 + 各制裁项目通用许可（GL）",
          steps: [
            "确认产品属于食品、药品、医疗设备、农业商品范畴",
            "核查GL范围（如Iran GL N-1, Venezuela GL 31等）",
            "确保交易不涉及SDN实体（除银行渠道外）",
            "按GL要求记录和报告交易"
          ],
          riskWarning: "医疗/食品虽豁免，但支付渠道仍受限；银行可能因合规压力拒绝处理",
          templates: ["豁免资格确认书", "GL合规检查表", "交易记录模板"],
          successRate: "高",
          timeFrame: "7-14天"
        }
      ]
    },
    
    // === 二级制裁应对（美国长臂管辖） ===
    secondarySanctions: {
      category: "二级制裁应对",
      description: "非美国人因「重大交易」与SDN实体交易，美国可制裁之",
      tools: [
        {
          id: "SS-1",
          name: "降低交易规模至「非重大」阈值以下",
          applicableWhen: ["secondary"],
          applicableCountries: ["ALL"],
          legalBasis: "CAATSA Section 228、31 CFR 各种制裁项目",
          steps: [
            "统计过去12个月与目标国家的累计交易金额",
            "若接近「重大交易」阈值（如CAATSA：单日石油交易超100万美元），拆分交易",
            "确保单笔交易、累计交易均低于法定阈值",
            "建立交易监控机制，防止无意超限"
          ],
          riskWarning: "「重大交易」无统一定量标准，OFAC综合考量金额、频率、意图",
          templates: ["交易规模评估表", "拆分交易方案", "监控日报"],
          successRate: "中",
          timeFrame: "30天"
        },
        {
          id: "SS-2",
          name: "切断美国连接点（de minimis + 无美国人参与）",
          applicableWhen: ["secondary"],
          applicableCountries: ["ALL"],
          legalBasis: "EAR 15 CFR 734.4（de minimis规则）、31 CFR 501.603（美国人facilitation）",
          steps: [
            "产品美国技术成分占比<25%（非禁运国家）或<10%（禁运国家）",
            "确保美国人（公民、绿卡、美国公司雇员）不参与交易",
            "不使用美元结算、不经美国银行、不通过美国平台",
            "交易文件明确排除美国法律适用、排除美国法院管辖"
          ],
          riskWarning: "即使切断所有连接点，仍可能因「故意规避」被制裁；需保留完整合规记录",
          templates: ["美国成分审查表", "交易参与方声明", "法律适用条款"],
          successRate: "中高",
          timeFrame: "45-60天"
        },
        {
          id: "SS-3",
          name: "交易对手尽职调查（KYC/AML升级）",
          applicableWhen: ["secondary"],
          applicableCountries: ["ALL"],
          legalBasis: "FATF建议、OFAC合规指南、BIS出口管制合规指南",
          steps: [
            "对交易对手进行OFAC/UN/EU/UK制裁清单筛查",
            "穿透至最终受益人（UBO），识别是否存在SDN/SSI持股",
            "核查交易对手历史：是否曾被制裁、是否有制裁相关诉讼",
            "签署合规承诺函，要求对方声明不在任何制裁清单上",
            "交易完成后保留记录至少5年"
          ],
          riskWarning: "50%持股规则：交易对手如50%以上被SDN持有，视同SDN",
          templates: ["KYC调查问卷", "UBO穿透报告", "合规承诺函", "制裁筛查记录"],
          successRate: "高",
          timeFrame: "14-30天"
        }
      ]
    },
    
    // === 出口管制应对（EAR/ITAR） ===
    exportControl: {
      category: "出口管制应对",
      description: "BIS对特定产品、技术、目的地实施出口许可制度",
      tools: [
        {
          id: "EC-1",
          name: "ECCN分类确认与许可证申请",
          applicableWhen: ["EAR"],
          applicableCountries: ["ALL"],
          legalBasis: "EAR 15 CFR 730-774、Commerce Control List",
          steps: [
            "对产品进行ECCN分类（自主判定或向BIS申请CCATS）",
            "确认出口目的地国别组（Country Group）",
            "核查EAR许可要求（License Requirement）",
            "如需要许可证，向BIS提交SNAP-R申请",
            "等待许可证审批（常规30-90天，紧急情况可加速）"
          ],
          riskWarning: "EAR99≠无风险；EAR99仍受反抵制、禁运限制；错误分类可能构成违规",
          templates: ["ECCN分类分析表", "CCATS申请函", "SNAP-R申请表"],
          successRate: "中高",
          timeFrame: "30-90天"
        },
        {
          id: "EC-2",
          name: "外国直接产品规则（FDPR）合规",
          applicableWhen: ["EAR"],
          applicableCountries: ["CN"],
          legalBasis: "EAR 15 CFR 734.9、FDPR（Entity List Footnote 1）",
          steps: [
            "确认产品是否使用特定美国技术/软件/设备生产",
            "确认产品是否属于EAR管辖范围（25% de minimis）",
            "如产品为「外国直接产品」且目标为实体清单企业，需申请许可证",
            "评估是否可通过更换非美国技术来源规避FDPR"
          ],
          riskWarning: "FDPR覆盖范围极广，即使微小美国技术成分也可能触发；更换技术来源成本高",
          templates: ["FDPR适用性分析表", "技术来源审查表", "规避方案评估"],
          successRate: "低中",
          timeFrame: "60-120天"
        },
        {
          id: "EC-3",
          name: "最终用户/最终用途核查（EUC/EUV）",
          applicableWhen: ["EAR"],
          applicableCountries: ["ALL"],
          legalBasis: "EAR 15 CFR 744.21（Military End Use/User）",
          steps: [
            "要求最终用户签署最终用户声明",
            "核查最终用途：民用、军事、核、化学、生物",
            "如最终用户为军事最终用户，禁止出口（特定许可例外除外）",
            "对高校/研究机构进行UVL筛查（未经核实清单）"
          ],
          riskWarning: "「应知」标准：如果通过尽职调查应当知道最终军事用途，仍出口即违规",
          templates: ["最终用户声明", "最终用途核查表", "UVL筛查记录"],
          successRate: "高",
          timeFrame: "7-14天"
        },
        {
          id: "EC-4",
          name: "许可证例外（License Exception）适用",
          applicableWhen: ["EAR"],
          applicableCountries: ["ALL"],
          legalBasis: "EAR 15 CFR 740（License Exceptions）",
          steps: [
            "确认产品ECCN及目的地国别组",
            "核查是否有适用的许可证例外（TSU、ENC、AGR、TMP等）",
            "确保满足例外的全部条件（如TSU要求公开技术、无加密）",
            "在出口文件中注明所适用的许可证例外编号",
            "保留记录备查"
          ],
          riskWarning: "许可证例外条件严格，误用可能导致违规；建议律师审核",
          templates: ["许可证例外适用性检查表", "出口文件模板"],
          successRate: "高",
          timeFrame: "7-14天"
        }
      ]
    },
    
    // === 中国反制裁应对（被外国制裁后的中国救济） ===
    chinaAntiSanction: {
      category: "中国反制裁应对",
      description: "中国企业/个人被外国制裁后，在中国法律框架下的救济措施",
      tools: [
        {
          id: "CAS-1",
          name: "中国法院反制裁诉讼（索赔+禁令）",
          applicableWhen: ["sanctioned"],
          applicableCountries: ["CN"],
          legalBasis: "《反外国制裁法》第12条、第13条、第14条",
          steps: [
            "在中国有管辖权的法院提起诉讼（被告住所地/合同履行地/侵权行为地）",
            "主张索赔：因执行外国制裁导致的损失赔偿",
            "主张禁令：禁止对方在中国境内执行外国制裁决定",
            "申请证据保全、财产保全",
            "如涉及外国被告，通过 Hague Service Convention 送达"
          ],
          riskWarning: "判决执行困难：外国被告在中国境内资产有限；需提前申请财产保全",
          templates: ["民事起诉状", "证据保全申请书", "财产保全申请书"],
          successRate: "中",
          timeFrame: "6-24个月"
        },
        {
          id: "CAS-2",
          name: "阻断法令豁免申请（商务部）",
          applicableWhen: ["sanctioned"],
          applicableCountries: ["CN"],
          legalBasis: "《阻断外国法律与措施不当域外适用办法》第9条",
          steps: [
            "向商务部提交书面申请，说明外国制裁对合法权益的损害",
            "提供合同、交易记录、制裁通知等证据",
            "商务部审查后发布「不得承认/执行外国制裁」的命令",
            "当事人可依据该命令要求交易对手继续履行合同"
          ],
          riskWarning: "审查周期不确定；阻断令仅适用于中国境内，不强制外国法院",
          templates: ["阻断令申请书", "损害证明材料清单"],
          successRate: "中",
          timeFrame: "30-90天"
        },
        {
          id: "CAS-3",
          name: "反制裁清单对等反制（政府层面）",
          applicableWhen: ["sanctioned"],
          applicableCountries: ["CN"],
          legalBasis: "《反外国制裁法》第6条、第7条、第8条",
          steps: [
            "向国务院有关部门（外交部/商务部）反映被制裁情况",
            "申请将制裁实施方列入中国反制裁清单",
            "反制措施包括：签证限制、资产冻结、交易禁令",
            "此路径主要为政府行为，企业可配合提供证据"
          ],
          riskWarning: "政府决策流程不透明，无法保证结果；企业需同时准备其他救济措施",
          templates: ["情况反映函", "证据材料"],
          successRate: "低中",
          timeFrame: "不确定"
        }
      ]
    },
    
    // === 合同条款预防（事前风控） ===
    contractPrevention: {
      category: "合同条款预防",
      description: "在合同中加入制裁合规条款，降低未来制裁风险",
      tools: [
        {
          id: "CP-1",
          name: "制裁合规条款（Sanctions Clause）",
          applicableWhen: ["preventive"],
          applicableCountries: ["ALL"],
          legalBasis: "合同自由原则、国际商事合同惯例",
          steps: [
            "在合同中加入「制裁条款」：双方声明不在制裁清单上",
            "加入「持续合规义务」：如被列入制裁清单，立即通知对方",
            "加入「终止权」：一方被制裁，另一方可立即终止合同",
            "加入「免责条款」：因制裁导致无法履行，不构成违约"
          ],
          riskWarning: "制裁条款需平衡双方利益，过度偏向一方可能导致合同无效（显失公平）",
          templates: ["制裁条款范本", "持续合规承诺", "终止通知模板"],
          successRate: "高",
          timeFrame: "合同谈判阶段"
        },
        {
          id: "CP-2",
          name: "不可抗力+法律变更组合条款",
          applicableWhen: ["preventive"],
          applicableCountries: ["ALL"],
          legalBasis: "《民法典》第180条、第533条、国际商事合同通则（PICC）",
          steps: [
            "定义「不可抗力」包括：战争、制裁、禁运、法律变更",
            "定义「法律变更」包括：制裁法规、出口管制法规、阻断法令",
            "明确通知义务：发生不可抗力/法律变更后X天内通知",
            "明确后果：暂停履行、变更履行、解除合同",
            "加入「减损义务」：双方应采取合理措施减少损失"
          ],
          riskWarning: "中国法院对「制裁是否构成不可抗力」有不同判例，建议明确约定",
          templates: ["不可抗力条款范本", "法律变更条款范本", "通知函模板"],
          successRate: "高",
          timeFrame: "合同谈判阶段"
        },
        {
          id: "CP-3",
          name: "争议解决条款（仲裁优先）",
          applicableWhen: ["preventive"],
          applicableCountries: ["ALL"],
          legalBasis: "《仲裁法》、纽约公约、ICSID公约",
          steps: [
            "优先选择仲裁而非诉讼：避免外国法院管辖、执行更便利",
            "推荐仲裁机构：SIAC（新加坡）、LCIA（伦敦）、HKIAC（香港）、CIETAC（中国）",
            "仲裁地选择：新加坡、香港、伦敦（中立、制裁风险低）",
            "适用法律选择：中国法、英国法、新加坡法（避免美国法）",
            "明确仲裁员资质要求：需熟悉国际制裁法"
          ],
          riskWarning: "仲裁裁决执行仍有风险：制裁国可能以公共政策为由拒绝执行",
          templates: ["仲裁条款范本（SIAC）", "仲裁条款范本（LCIA）", "法律适用条款"],
          successRate: "高",
          timeFrame: "合同谈判阶段"
        }
      ]
    }
  };

  // --------------------------------------------------------
  // 2. 风险类型 → 法律工具匹配引擎
  // --------------------------------------------------------
  const RISK_TOOL_MAPPING = {
    // 国家风险级别
    country: {
      comprehensive: ["PS-1", "PS-2", "PS-3", "PS-5", "CP-1", "CP-2"],
      sectoral: ["PS-1", "PS-2", "PS-3", "PS-4", "CP-1", "CP-2"],
      high: ["SS-1", "SS-2", "SS-3", "CP-1"],
      medium: ["SS-3", "CP-1"],
      low: ["CP-1"]
    },
    // 实体匹配风险
    entity: {
      critical: ["PS-3", "PS-4", "SS-2", "SS-3", "CAS-1", "CAS-2"],
      high: ["PS-3", "SS-2", "SS-3", "EC-1", "EC-3"],
      medium: ["SS-3", "EC-3", "EC-4"]
    },
    // 连接点风险
    connection: {
      critical: ["SS-2", "EC-2", "PS-3"],
      high: ["SS-2", "EC-1", "EC-3"],
      medium: ["EC-4", "SS-3"],
      low: ["SS-3"]
    },
    // 出口管制风险
    exportControl: {
      critical: ["EC-1", "EC-2", "PS-3"],
      high: ["EC-1", "EC-3", "EC-4"],
      medium: ["EC-3", "EC-4"]
    }
  };

  // --------------------------------------------------------
  // 3. 文书模板库（简版，实际可扩展）
  // --------------------------------------------------------
  const DOCUMENT_TEMPLATES = {
    "阻断令申请书": {
      title: "阻断外国法律与措施不当域外适用申请书",
      sections: ["申请人信息", "被申请外国法律/措施", "域外适用情况", "对中国合法权益的损害", "申请事项", "证据清单"],
      authority: "中华人民共和国商务部",
      legalBasis: "《阻断外国法律与措施不当域外适用办法》第9条"
    },
    "继续履行通知函": {
      title: "要求继续履行合同的通知函",
      sections: ["合同背景", "外国制裁情况", "中国阻断法令依据", "继续履行要求", "法律后果告知", "回复期限"],
      authority: "企业法务部",
      legalBasis: "《反外国制裁法》第12条"
    },
    "不可抗力通知函": {
      title: "不可抗力事件通知函",
      sections: ["合同引用", "不可抗力事件描述", "因果关系论证", "影响范围", "拟采取措施", "期望协商"],
      authority: "企业法务部",
      legalBasis: "《民法典》第180条、合同不可抗力条款"
    },
    "合同变更协议": {
      title: "合同变更协议书",
      sections: ["原合同信息", "变更原因", "变更内容", "权利义务调整", "生效条件", "争议解决"],
      authority: "双方签署",
      legalBasis: "《民法典》第543条"
    },
    "OFAC特定许可申请表": {
      title: "Office of Foreign Assets Control Specific License Application",
      sections: ["Applicant Info", "Sanctions Program", "Transaction Description", "Legal Basis", "Supporting Documents", "Compliance Commitments"],
      authority: "US Department of Treasury - OFAC",
      legalBasis: "31 CFR 501"
    },
    "KYC调查问卷": {
      title: "交易对手尽职调查问卷（制裁合规专用）",
      sections: ["基本信息", "股权结构", "最终受益人", "制裁清单筛查", "历史合规记录", "声明与保证"],
      authority: "企业合规部",
      legalBasis: "FATF建议、OFAC合规指南"
    },
    "ECCN分类分析表": {
      title: "出口管制分类自动判定分析表（ECCN Self-Classification）",
      sections: ["产品描述", "技术参数", "功能用途", "CCL对照", "ECCN结论", "管制原因", "许可证要求"],
      authority: "企业出口管制合规部",
      legalBasis: "EAR 15 CFR 774"
    },
    "民事起诉状": {
      title: "民事起诉状（反外国制裁损害赔偿）",
      sections: ["当事人信息", "诉讼请求", "事实与理由", "法律依据", "证据清单", "管辖说明"],
      authority: "中国法院",
      legalBasis: "《反外国制裁法》第12、13、14条"
    },
    "制裁条款范本": {
      title: "国际贸易合同制裁合规条款",
      sections: ["制裁声明", "持续合规义务", "通知义务", "终止权", "免责条款", "争议解决"],
      authority: "合同附件",
      legalBasis: "合同自由原则"
    },
    "仲裁条款范本（SIAC）": {
      title: "新加坡国际仲裁中心仲裁条款",
      sections: ["仲裁机构", "仲裁规则", "仲裁地", "仲裁语言", "仲裁员人数", "适用法律"],
      authority: "SIAC",
      legalBasis: "新加坡《国际仲裁法》"
    }
  };

  // --------------------------------------------------------
  // 4. 核心函数：法律护盾生成引擎
  // --------------------------------------------------------
  
  /**
   * 根据制裁扫描结果匹配法律工具
   */
  function matchLegalTools(riskAssessment) {
    const matchedTools = new Map();
    
    // 从风险评估中提取关键信息
    const countryLevel = riskAssessment.countryScan?.countryRisk?.level || "low";
    const entityLevel = riskAssessment.entitySearch?.length > 0 ? 
      (riskAssessment.entitySearch[0].riskLevel) : "none";
    const connectionLevel = riskAssessment.secondaryRisk?.connectionAnalysis?.level || "low";
    const exportLevel = riskAssessment.exportControl?.riskLevel || "none";
    
    // 获取推荐的工具ID列表
    const toolIds = new Set();
    
    // 国家风险匹配
    if (RISK_TOOL_MAPPING.country[countryLevel]) {
      RISK_TOOL_MAPPING.country[countryLevel].forEach(id => toolIds.add(id));
    }
    
    // 实体风险匹配
    if (RISK_TOOL_MAPPING.entity[entityLevel]) {
      RISK_TOOL_MAPPING.entity[entityLevel].forEach(id => toolIds.add(id));
    }
    
    // 连接点风险匹配
    if (RISK_TOOL_MAPPING.connection[connectionLevel]) {
      RISK_TOOL_MAPPING.connection[connectionLevel].forEach(id => toolIds.add(id));
    }
    
    // 出口管制风险匹配
    if (RISK_TOOL_MAPPING.exportControl[exportLevel]) {
      RISK_TOOL_MAPPING.exportControl[exportLevel].forEach(id => toolIds.add(id));
    }
    
    //  always add preventive tools
    RISK_TOOL_MAPPING.country.low.forEach(id => toolIds.add(id));
    
    // 去重并按优先级排序
    const allTools = [];
    for (const category of Object.values(LEGAL_TOOLS)) {
      for (const tool of category.tools) {
        if (toolIds.has(tool.id)) {
          allTools.push({
            ...tool,
            category: category.category,
            categoryDesc: category.description
          });
        }
      }
    }
    
    // 按优先级排序：critical > high > medium > low
    const priorityOrder = { "高": 4, "中高": 3, "中": 2, "低中": 1, "低": 0 };
    allTools.sort((a, b) => priorityOrder[b.successRate] - priorityOrder[a.successRate]);
    
    return allTools;
  }
  
  /**
   * 生成法律护盾方案
   */
  function generateLawShield(riskAssessment, userProfile = {}) {
    const tools = matchLegalTools(riskAssessment);
    const userCountry = userProfile.country || "CN";
    const userIndustry = userProfile.industry || "general";
    
    // 过滤用户国家不适用的工具
    const applicableTools = tools.filter(t => 
      t.applicableCountries.includes("ALL") || t.applicableCountries.includes(userCountry)
    );
    
    // 生成行动方案
    const actionPlan = [];
    const immediateActions = [];
    const shortTermActions = [];
    const longTermActions = [];
    
    for (const tool of applicableTools.slice(0, 6)) {
      const steps = tool.steps.map((step, idx) => ({
        step: idx + 1,
        description: step,
        deadline: tool.timeFrame,
        responsible: "法务部/合规部/外部律师"
      }));
      
      const action = {
        toolId: tool.id,
        toolName: tool.name,
        category: tool.category,
        legalBasis: tool.legalBasis,
        successRate: tool.successRate,
        timeFrame: tool.timeFrame,
        riskWarning: tool.riskWarning,
        steps: steps,
        templates: tool.templates.map(t => ({
          name: t,
          available: DOCUMENT_TEMPLATES[t] ? true : false,
          templateInfo: DOCUMENT_TEMPLATES[t] || null
        }))
      };
      
      actionPlan.push(action);
      
      // 分类时间线
      if (tool.timeFrame.includes("7") || tool.timeFrame.includes("14")) {
        immediateActions.push(action);
      } else if (tool.timeFrame.includes("30") || tool.timeFrame.includes("45") || tool.timeFrame.includes("60")) {
        shortTermActions.push(action);
      } else {
        longTermActions.push(action);
      }
    }
    
    // 生成整体建议
    const overallRecommendations = generateOverallRecommendations(riskAssessment, applicableTools);
    
    // 生成合规检查清单
    const complianceChecklist = generateComplianceChecklist(riskAssessment);
    
    return {
      generatedAt: new Date().toISOString(),
      version: "2.0.0-legal",
      riskSummary: {
        countryLevel: riskAssessment.countryScan?.countryRisk?.level || "unknown",
        entityLevel: riskAssessment.entitySearch?.length > 0 ? riskAssessment.entitySearch[0].riskLevel : "none",
        connectionLevel: riskAssessment.secondaryRisk?.connectionAnalysis?.level || "low",
        exportLevel: riskAssessment.exportControl?.riskLevel || "none",
        overallScore: riskAssessment.overallRisk?.score || 0
      },
      applicableTools: applicableTools.length,
      totalToolsMatched: tools.length,
      actionPlan: actionPlan,
      timeline: {
        immediate: immediateActions,
        shortTerm: shortTermActions,
        longTerm: longTermActions
      },
      overallRecommendations: overallRecommendations,
      complianceChecklist: complianceChecklist,
      documentTemplates: Object.keys(DOCUMENT_TEMPLATES),
      legalBasis: {
        chinese: ["《反外国制裁法》", "《阻断外国法律与措施不当域外适用办法》", "《民法典》"],
        us: ["31 CFR 501", "EAR 15 CFR 730-774", "EO 13850/13902/14024"],
        international: ["UN SCR 1718", "EU Regulation 833/2014", "FATF建议"]
      }
    };
  }
  
  /**
   * 生成整体建议
   */
  function generateOverallRecommendations(riskAssessment, tools) {
    const recs = [];
    const score = riskAssessment.overallRisk?.score || 0;
    
    if (score >= 80) {
      recs.push({
        priority: "critical",
        title: "立即暂停交易",
        desc: "风险评分≥80，建议立即暂停与目标国家/实体的交易，直至法律风险评估完成。",
        action: "联系专业制裁律师，启动应急响应程序"
      });
    }
    
    if (score >= 60) {
      recs.push({
        priority: "high",
        title: "启动法律护盾方案",
        desc: "风险评分60-79，建议立即启动上述法律工具，优先选择高成功率方案。",
        action: "30天内完成阻断令申请或OFAC许可申请"
      });
    }
    
    if (riskAssessment.entitySearch?.length > 0) {
      recs.push({
        priority: "high",
        title: "实体穿透调查",
        desc: "检测到制裁实体匹配，需立即对交易对手进行穿透调查，确认是否存在50%持股规则触发。",
        action: "7天内完成KYC/AML升级调查"
      });
    }
    
    if (riskAssessment.exportControl?.licenseRequired) {
      recs.push({
        priority: "high",
        title: "出口许可证申请",
        desc: "产品出口需许可证，未经许可证出口可能构成刑事犯罪。",
        action: "立即停止发货，启动SNAP-R申请"
      });
    }
    
    // 总是加入预防性建议
    recs.push({
      priority: "medium",
      title: "合同条款审查",
      desc: "无论当前风险如何，建议在所有国际贸易合同中加入制裁合规条款。",
      action: "下一次合同续约时加入制裁条款范本"
    });
    
    recs.push({
      priority: "medium",
      title: "建立合规体系",
      desc: "建立出口管制合规（ECP）体系，包括筛查、培训、审计、记录保存。",
      action: "6个月内建立完整的ECP体系"
    });
    
    return recs;
  }
  
  /**
   * 生成合规检查清单
   */
  function generateComplianceChecklist(riskAssessment) {
    return [
      { id: "CK-1", category: "筛查", item: "交易对手OFAC/UN/EU/UK制裁清单筛查", frequency: "每笔交易", responsible: "合规部" },
      { id: "CK-2", category: "筛查", item: "最终受益人（UBO）穿透调查", frequency: "每笔交易", responsible: "法务部" },
      { id: "CK-3", category: "筛查", item: "50%持股规则核查（SDN/SSI）", frequency: "每笔交易", responsible: "合规部" },
      { id: "CK-4", category: "出口管制", item: "产品ECCN分类确认", frequency: "产品首次出口", responsible: "技术部+合规部" },
      { id: "CK-5", category: "出口管制", item: "最终用户/最终用途声明（EUV）", frequency: "每笔交易", responsible: "销售部" },
      { id: "CK-6", category: "出口管制", item: "美国技术成分占比审查（de minimis）", frequency: "产品变更时", responsible: "技术部" },
      { id: "CK-7", category: "金融", item: "支付渠道制裁审查（SWIFT/美元/代理行）", frequency: "每笔交易", responsible: "财务部" },
      { id: "CK-8", category: "金融", item: "加密货币交易禁止政策执行", frequency: "持续", responsible: "财务部+合规部" },
      { id: "CK-9", category: "合同", item: "合同制裁条款审查", frequency: "合同签署前", responsible: "法务部" },
      { id: "CK-10", category: "合同", item: "争议解决条款（仲裁优先）审查", frequency: "合同签署前", responsible: "法务部" },
      { id: "CK-11", category: "记录", item: "交易记录保存5年", frequency: "持续", responsible: "档案部" },
      { id: "CK-12", category: "培训", item: "员工制裁合规培训（年度）", frequency: "每年", responsible: "HR+合规部" },
      { id: "CK-13", category: "审计", item: "制裁合规内部审计（年度）", frequency: "每年", responsible: "内审部" },
      { id: "CK-14", category: "应急", item: "制裁突发事件应急预案", frequency: "每半年演练", responsible: "管理层" }
    ];
  }
  
  /**
   * 生成简易文书（基于模板填充）
   */
  function generateDocument(templateName, variables = {}) {
    const template = DOCUMENT_TEMPLATES[templateName];
    if (!template) return null;
    
    const defaults = {
      companyName: "[公司名称]",
      counterpartyName: "[交易对手名称]",
      contractDate: "[合同日期]",
      contractNumber: "[合同编号]",
      sanctionProgram: "[制裁项目名称]",
      transactionAmount: "[交易金额]",
      productDescription: "[产品描述]",
      countryName: "[国家名称]",
      entityName: "[实体名称]",
      legalRepresentative: "[法定代表人]",
      date: new Date().toISOString().split('T')[0]
    };
    
    const vars = { ...defaults, ...variables };
    
    return {
      templateName: templateName,
      title: template.title,
      sections: template.sections,
      legalBasis: template.legalBasis,
      authority: template.authority,
      draftDate: vars.date,
      placeholders: vars,
      notes: [
        "本文件为AI生成的初稿，需由专业律师审核后使用",
        "所有[]标记的内容需根据实际情况填写",
        "提交前请确认法律依据和管辖机构是否有更新"
      ]
    };
  }

  // --------------------------------------------------------
  // 5. 暴露到全局
  // --------------------------------------------------------
  window.LawFlowLawShieldEnhanced = {
    legalTools: LEGAL_TOOLS,
    riskMapping: RISK_TOOL_MAPPING,
    documentTemplates: DOCUMENT_TEMPLATES,
    
    // 核心函数
    matchLegalTools: matchLegalTools,
    generateLawShield: generateLawShield,
    generateDocument: generateDocument,
    generateComplianceChecklist: generateComplianceChecklist,
    
    // 工具函数
    getToolById: (id) => {
      for (const category of Object.values(LEGAL_TOOLS)) {
        const tool = category.tools.find(t => t.id === id);
        if (tool) return { ...tool, category: category.category };
      }
      return null;
    },
    getToolsByCategory: (category) => {
      const cat = LEGAL_TOOLS[category];
      return cat ? cat.tools.map(t => ({ ...t, category: cat.category })) : [];
    },
    getAllCategories: () => Object.keys(LEGAL_TOOLS),
    getTemplateNames: () => Object.keys(DOCUMENT_TEMPLATES),
    getTemplateByName: (name) => DOCUMENT_TEMPLATES[name],
    
    // 版本信息
    version: "2.0.0-legal",
    lastUpdated: "2025-06-28"
  };

  console.log("[LawFlow] 法律护盾增强模块 v2.0 已加载");
  console.log(`[LawFlow] 法律工具库: ${Object.values(LEGAL_TOOLS).reduce((sum, cat) => sum + cat.tools.length, 0)} 个`);
  console.log(`[LawFlow] 文书模板: ${Object.keys(DOCUMENT_TEMPLATES).length} 种`);

})();