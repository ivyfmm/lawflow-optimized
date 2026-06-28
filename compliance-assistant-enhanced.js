// ============================================================
// LawFlow AI - 合规助手增强模块 v2.0
// 法律人逻辑：问题分类 → 知识检索 → 答案生成 → 法律依据引用
// ============================================================

(function() {
  'use strict';

  // --------------------------------------------------------
  // 1. 法律知识库（结构化）
  // --------------------------------------------------------
  const KNOWLEDGE_BASE = {
    sanctions: {
      name: "制裁合规",
      keywords: ["制裁", "sanction", "OFAC", "SDN", "实体清单", "Entity List", "UVL", "unverified", "封锁", "禁运"],
      qa: [
        {
          q: ["什么是SDN清单", "SDN是什么", "SDN list"],
          a: "SDN（Specially Designated Nationals）清单是OFAC维护的核心制裁名单，列入该名单的个人和实体在美国境内的一切资产被冻结，美国人（含美国企业）不得与其进行任何交易。非美国人若涉及美国人或美国金融系统进行交易，也可能面临二级制裁风险。",
          legalBasis: "31 CFR 501 + OFAC SDN List",
          riskLevel: "critical"
        },
        {
          q: ["什么是实体清单", "Entity List", "BIS实体清单"],
          a: "实体清单（Entity List）由BIS（美国商务部工业安全局）维护，列入该清单的实体在获取受EAR管辖的物项时需要申请出口许可证，且通常适用'推定拒绝'的审查标准。2024年实体清单已扩展至数百家中国实体，主要集中在半导体、人工智能、量子计算、生物技术等高科技领域。",
          legalBasis: "EAR 15 CFR 744 Supplement No. 4",
          riskLevel: "high"
        },
        {
          q: ["什么是UVL", "未核实清单", "Unverified List"],
          a: "未核实清单（UVL）是BIS维护的中间名单，列入该清单的实体因BIS无法完成最终用户核查而被标记。与实体清单不同，UVL上的实体仍可以获取EAR管辖物项，但交易前需进行额外的尽职调查。若60天内无法完成核查，该实体可能被升级至实体清单。",
          legalBasis: "EAR 15 CFR 744 Supplement No. 6",
          riskLevel: "medium"
        },
        {
          q: ["什么是二级制裁", "secondary sanction", "次级制裁"],
          a: "二级制裁（Secondary Sanctions）是美国对非美国人/实体施加的制裁，即使交易不涉及美国连接点，只要与受制裁国家/实体进行特定交易，就可能被列入SDN清单或面临其他限制。典型案例：中国昆仑银行因与伊朗交易而被切断SWIFT通道。",
          legalBasis: "CISADA + Iran Freedom and Counter-Proliferation Act",
          riskLevel: "critical"
        },
        {
          q: ["如何避免制裁风险", "制裁合规措施", "合规建议"],
          a: "1. 建立制裁筛查制度：交易前筛查SDN、Entity List、UVL等名单；2. 进行供应链溯源：确保不涉及强迫劳动（UFLPA）；3. 审查交易连接点：评估美元结算、SWIFT、美国技术、美国人参与等风险；4. 合同中加入制裁条款：明确双方不在制裁清单上，约定制裁为不可抗力；5. 建立持续监控机制：定期更新筛查系统。",
          legalBasis: "OFAC合规指南 + BIS出口合规指南",
          riskLevel: "medium"
        }
      ]
    },
    exportControl: {
      name: "出口管制",
      keywords: ["出口管制", "export control", "EAR", "ECCN", "CCL", "Commerce Control List", "许可证", "license", "物项", "item"],
      qa: [
        {
          q: ["什么是EAR", "出口管理条例", "Export Administration Regulations"],
          a: "EAR（Export Administration Regulations）是美国商务部BIS制定的出口管制法规，管辖所有美国原产物项以及含美国技术/成分的外国产品（受控比例：25% for embargoed countries, 10% for China）。EAR通过ECCN分类系统对物项进行管制，并规定了不同目的地、最终用户、最终用途的许可要求。",
          legalBasis: "15 CFR 730-774",
          riskLevel: "high"
        },
        {
          q: ["什么是ECCN", "出口管制分类", "Export Control Classification Number"],
          a: "ECCN是出口管制分类号码，由5位字符组成（如3A001），用于标识受EAR管辖物项的管制类别。第一位数字代表类别（0-9），第二位字母代表产品类型（A-E），第三位数字代表管制原因。准确的ECCN分类是出口合规的基础，分类错误可能导致未经许可出口重罪。",
          legalBasis: "15 CFR 738 + Commerce Control List",
          riskLevel: "high"
        },
        {
          q: ["什么是外国直接产品规则", "FDPR", "Foreign Direct Product Rule"],
          a: "FDPR（外国直接产品规则）是BIS的重要规则，规定若外国产品使用特定美国技术/软件/设备生产，即使产品不来自美国，也受EAR管辖。针对华为的规则（Footnote 1）适用0%美国成分门槛，意味着任何使用特定美国技术生产的产品都不能向华为出口。2022年10月规则进一步扩展至先进芯片和超算领域。",
          legalBasis: "15 CFR 734.9 + EAR Supplement No. 4 to Part 734",
          riskLevel: "critical"
        },
        {
          q: ["什么是 deemed export", "视同出口", "技术出口"],
          a: "视同出口（Deemed Export）指在美国境内向外国人释放技术或源代码，即视为向该外国人所属国家出口技术。例如，美国公司雇佣中国籍工程师接触受控技术，需要视同出口许可证。这一规则对外国留学生在美从事研究工作也有重要影响。",
          legalBasis: "15 CFR 734.14 + 734.2(b)(2)(ii)",
          riskLevel: "medium"
        },
        {
          q: ["出口许可证如何申请", "BIS许可证", "SNAP-R"],
          a: "BIS许可证通过SNAP-R系统（Simplified Network Application Process - Redesign）在线申请。申请流程：1. 确定ECCN分类；2. 评估目的地、最终用户、最终用途；3. 检查是否有适用的许可例外；4. 在SNAP-R提交申请；5. 等待BIS审查（通常90-180天）。对于实体清单上的交易对手，通常适用'推定拒绝'标准。",
          legalBasis: "15 CFR 748 + 750",
          riskLevel: "medium"
        }
      ]
    },
    contract: {
      name: "国际商事合同",
      keywords: ["合同", "contract", "不可抗力", "force majeure", "争议解决", "仲裁", "arbitration", "管辖", "jurisdiction", "条款"],
      qa: [
        {
          q: ["制裁是否属于不可抗力", "制裁 不可抗力", "sanction force majeure"],
          a: "制裁是否构成不可抗力取决于合同具体约定和适用法律。建议：1. 在合同中明确定义'制裁'为不可抗力事件，列举OFAC、BIS、EU等制裁措施；2. 约定制裁发生时的通知义务、暂停履行权、合同解除权；3. 明确因制裁导致无法履行的免责范围。根据《联合国国际货物销售合同公约》（CISG）第79条，若障碍超出当事人控制且无法预见，可免责。",
          legalBasis: "CISG Art.79 + 合同自治原则",
          riskLevel: "medium"
        },
        {
          q: ["争议解决选择仲裁还是诉讼", "仲裁 vs 诉讼", "dispute resolution"],
          a: "对于涉华国际贸易，建议优先选择仲裁：1. 新加坡国际仲裁中心（SIAC）—— 中立、高效、可执行性高；2. 香港国际仲裁中心（HKIAC）—— 熟悉中国法律环境；3. 中国国际经济贸易仲裁委员会（CIETAC）—— 中国官方仲裁机构。避免选择美国法院管辖，因为美国法院可能适用长臂管辖，且制裁判决可能无法在中国执行。",
          legalBasis: "纽约公约 + 仲裁法",
          riskLevel: "medium"
        },
        {
          q: ["合同应加入哪些制裁条款", "制裁合规条款", "制裁条款范本"],
          a: "必备制裁条款：1. 陈述与保证：双方声明不在任何制裁清单上；2. 合规义务：承诺遵守所有适用制裁法规；3. 制裁为不可抗力：明确制裁事件的处理机制；4. 合规审计权：赋予对方审查合规记录的权利；5. 违约责任：约定违反制裁条款的违约金和解除权；6. 出口管制条款：约定ECCN分类义务和许可证申请责任。",
          legalBasis: "合同自治 + OFAC/BIS合规要求",
          riskLevel: "high"
        }
      ]
    },
    uflpa: {
      name: "强迫劳动合规",
      keywords: ["强迫劳动", "forced labor", "UFLPA", "维吾尔", "Xinjiang", "供应链", "supply chain", "溯源"],
      qa: [
        {
          q: ["什么是UFLPA", "维吾尔强迫劳动预防法", "Uyghur Forced Labor Prevention Act"],
          a: "UFLPA是美国2022年生效的法律，建立'可反驳推定'原则：所有来自中国新疆的产品都被推定使用强迫劳动，禁止进口。除非进口商能提供'清晰且令人信服的证据'证明供应链无强迫劳动。该法适用于所有产品，不仅限于棉花、番茄、多晶硅等高风险产品。2024年执法范围已扩展至新疆以外的中国产品。",
          legalBasis: "Pub.L. 117-78 (UFLPA)",
          riskLevel: "high"
        },
        {
          q: ["如何准备UFLPA合规", "供应链溯源", "供应链尽调"],
          a: "UFLPA合规三步法：1. 供应链地图：绘制从原材料到成品的完整供应链图谱；2. 尽职调查：对供应商进行劳动合规审计，获取书面证明；3. 证据保存：保留所有供应链文件、审计报告、合同条款，以应对CBP审查。建议建立'供应链合规管理系统'，定期更新供应商信息。",
          legalBasis: "CBP UFLPA Operational Guidance",
          riskLevel: "medium"
        }
      ]
    },
    cbam: {
      name: "碳边境调节机制",
      keywords: ["CBAM", "碳边境", "碳关税", "carbon border", "EU CBAM", "气候", "climate"],
      qa: [
        {
          q: ["什么是CBAM", "碳边境调节机制", "Carbon Border Adjustment Mechanism"],
          a: "CBAM是欧盟2023年启动的碳边境调节机制，要求进口商对钢铁、水泥、铝、化肥、电力、氢的进口产品申报碳排放数据，并购买CBAM证书以抵消欧盟与出口国之间的碳价差异。2023-2025年为过渡期，仅需申报；2026年正式征收。中国出口商需提前准备碳排放数据，否则面临高额税费。",
          legalBasis: "EU Regulation 2023/956",
          riskLevel: "high"
        },
        {
          q: ["CBAM如何计算", "碳排放申报", "CBAM证书"],
          a: "CBAM计算方式：CBAM证书数量 = 进口产品隐含碳排放量 × (EU ETS碳价 - 出口国碳价)。申报需提供：1. 直接排放（生产过程燃烧排放）；2. 间接排放（电力消耗排放）；3. 前体材料排放。若无法提供实际排放数据，则使用欧盟设定的默认值（通常更高）。",
          legalBasis: "EU CBAM Implementing Regulation",
          riskLevel: "medium"
        }
      ]
    }
  };

  // --------------------------------------------------------
  // 2. 智能问答引擎
  // --------------------------------------------------------
  function searchAnswer(question) {
    if (!question || question.trim().length < 2) {
      return {
        valid: false,
        error: "问题太短，请详细描述您的法律问题"
      };
    }

    const q = question.toLowerCase();
    let bestMatches = [];

    // 遍历所有分类
    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
      // 检查分类关键词匹配
      const categoryMatch = data.keywords.some(k => q.includes(k.toLowerCase()));
      
      for (const item of data.qa) {
        let score = 0;
        
        // 问题匹配
        for (const variant of item.q) {
          const v = variant.toLowerCase();
          if (q === v) score += 10; // 完全匹配
          else if (q.includes(v)) score += 5; // 包含
          else if (v.includes(q)) score += 3; // 被包含
          
          // 分词匹配
          const qWords = q.split(/[\s,，。.?]+/).filter(w => w.length > 1);
          const vWords = v.split(/[\s,，。.?]+/).filter(w => w.length > 1);
          const commonWords = qWords.filter(w => vWords.includes(w));
          score += commonWords.length * 2;
        }
        
        // 分类关键词加分
        if (categoryMatch) score += 2;
        
        // 风险等级加权（高风险问题优先）
        if (item.riskLevel === 'critical') score += 1;
        
        if (score > 0) {
          bestMatches.push({ ...item, score, category: data.name });
        }
      }
    }

    // 排序取最佳匹配
    bestMatches.sort((a, b) => b.score - a.score);
    
    if (bestMatches.length === 0) {
      return {
        valid: true,
        question: question,
        answer: "抱歉，当前知识库未涵盖该问题。建议您：1. 用更具体的法律术语重新描述；2. 或联系专业律师获取定制化建议。",
        legalBasis: "",
        riskLevel: "low",
        relatedQuestions: getPopularQuestions(),
        category: "未知"
      };
    }

    const best = bestMatches[0];
    return {
      valid: true,
      question: question,
      answer: best.a,
      legalBasis: best.legalBasis,
      riskLevel: best.riskLevel,
      category: best.category,
      relatedQuestions: bestMatches.slice(1, 4).map(m => m.q[0]),
      confidence: Math.min(best.score * 10, 95)
    };
  }

  function getPopularQuestions() {
    return [
      "什么是SDN清单？",
      "什么是实体清单（Entity List）？",
      "什么是ECCN出口管制分类？",
      "制裁是否属于不可抗力？",
      "什么是外国直接产品规则（FDPR）？",
      "什么是UFLPA？",
      "什么是CBAM碳边境调节机制？",
      "合同应加入哪些制裁条款？"
    ];
  }

  function getSuggestionsByKeyword(keyword) {
    const suggestions = [];
    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (data.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))) {
        for (const item of data.qa) {
          suggestions.push(item.q[0]);
        }
      }
    }
    return suggestions.slice(0, 5);
  }

  // --------------------------------------------------------
  // 3. 暴露到全局
  // --------------------------------------------------------
  window.LawFlowComplianceAssistant = {
    searchAnswer: searchAnswer,
    getPopularQuestions: getPopularQuestions,
    getSuggestionsByKeyword: getSuggestionsByKeyword,
    knowledgeBase: KNOWLEDGE_BASE,
    version: "2.0.0-legal",
    lastUpdated: "2025-06-28"
  };

  console.log('[LawFlow] 合规助手增强模块 v2.0 已加载');
  console.log(`[LawFlow] 知识库分类: ${Object.keys(KNOWLEDGE_BASE).length} 个领域`);
  console.log(`[LawFlow] 问答对: ${Object.values(KNOWLEDGE_BASE).reduce((a,b) => a + b.qa.length, 0)} 条`);

})();
