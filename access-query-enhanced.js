// ============================================================
// LawFlow AI - 准入查询增强模块 v2.0
// 法律人逻辑：产品分类 → 管制判定 → 准入条件 → 认证清单
// ============================================================

(function() {
  'use strict';

  // --------------------------------------------------------
  // 1. ECCN 出口管制分类数据库（扩展版）
  // --------------------------------------------------------
  const ECCN_DATABASE = {
    "3A001": { desc: "电子元件（高性能处理器/微电路）", controlReason: "NS/MT", usContent: "高", riskLevel: "high", dualUse: true, militaryEndUse: true, licenseException: ["TSU","BAG"] },
    "3A090": { desc: "先进计算芯片（AI/GPU芯片，>4800 TOPS）", controlReason: "RS/AT", usContent: "高", riskLevel: "critical", dualUse: true, militaryEndUse: true, licenseException: [] },
    "3A991": { desc: "通用电子元件（消费级处理器）", controlReason: "AT", usContent: "低", riskLevel: "low", dualUse: false, militaryEndUse: false, licenseException: ["TSU","BAG","GOV"] },
    "3E001": { desc: "电子/半导体制造技术（<28nm工艺）", controlReason: "NS/RS/AT", usContent: "高", riskLevel: "critical", dualUse: true, militaryEndUse: true, licenseException: [] },
    "4A003": { desc: "数字计算机/服务器（高性能计算）", controlReason: "NS/AT", usContent: "中", riskLevel: "medium", dualUse: true, militaryEndUse: true, licenseException: ["APP"] },
    "5A002": { desc: "信息安全设备（加密/网络安全）", controlReason: "NS/AT", usContent: "中", riskLevel: "high", dualUse: true, militaryEndUse: true, licenseException: ["ENC","TSU"] },
    "5A992": { desc: "民用通信设备（消费级网络设备）", controlReason: "AT", usContent: "低", riskLevel: "low", dualUse: false, militaryEndUse: false, licenseException: ["TSU","BAG"] },
    "6A003": { desc: "光学/摄像设备（含红外/夜视）", controlReason: "NS/AT", usContent: "中", riskLevel: "high", dualUse: true, militaryEndUse: true, licenseException: ["BAG"] },
    "7A001": { desc: "导航/航空电子设备（GPS/INS）", controlReason: "NS/MT", usContent: "高", riskLevel: "high", dualUse: true, militaryEndUse: true, licenseException: [] },
    "9A515": { desc: "航天器及相关设备（卫星/火箭部件）", controlReason: "NS/MT/RS", usContent: "高", riskLevel: "critical", dualUse: true, militaryEndUse: true, licenseException: [] },
    "0A979": { desc: "军事训练/仿真设备", controlReason: "SL", usContent: "高", riskLevel: "critical", dualUse: false, militaryEndUse: true, licenseException: [] },
    "EAR99": { desc: "未列入CCL的EAR管辖物项", controlReason: "AT", usContent: "低", riskLevel: "low", dualUse: false, militaryEndUse: false, licenseException: ["BAG","TSU","GOV"] }
  };

  // --------------------------------------------------------
  // 2. 目标市场准入数据库（主要市场）
  // --------------------------------------------------------
  const MARKET_ACCESS_DB = {
    "US": {
      name: "美国",
      keyRequirements: ["FCC认证（无线/通信设备）","FDA认证（食品/药品/医疗器械）","EPA认证（环保产品）","CPSC认证（消费品安全）","UL认证（电气安全）"],
      importRestrictions: ["《维吾尔强迫劳动预防法》(UFLPA)——涉疆产品禁止进口","《芯片与科学法案》——先进芯片对华出口限制","301条款关税——部分商品额外加征关税"],
      specialNotes: "美国市场对中国电子产品审查严格，建议准备完整的供应链溯源文件。",
      tradeAgreement: "无双边自贸协定（中国），适用MFN税率"
    },
    "EU": {
      name: "欧盟",
      keyRequirements: ["CE标志（强制性产品认证）","RoHS指令（有害物质限制）","REACH法规（化学品注册）","WEEE指令（电子废弃物回收）","EUDR（欧盟零毁林法案）——农产品/木材"],
      importRestrictions: ["碳边境调节机制(CBAM)——钢铁、水泥、铝、化肥、电力、氢","禁止强迫劳动产品法规——2027年生效","对华电动汽车反补贴税——额外加征关税"],
      specialNotes: "CBAM过渡期至2025年底，2026年正式实施。建议提前准备碳排放数据。",
      tradeAgreement: "无双边自贸协定（中国），适用MFN税率"
    },
    "UK": {
      name: "英国",
      keyRequirements: ["UKCA标志（英国符合性评估）","UK REACH（英国化学品法规）","WEEE法规（电子废弃物）"],
      importRestrictions: ["对华电动汽车调查","UKCA标志过渡期已于2024年12月结束"],
      specialNotes: "UKCA标志现已强制要求，CE标志不再被接受。",
      tradeAgreement: "无双边自贸协定（中国）"
    },
    "JP": {
      name: "日本",
      keyRequirements: ["PSE标志（电气用品安全）","TELEC认证（无线电设备）","JIS认证（工业标准）","食品卫生法（食品/化妆品）"],
      importRestrictions: ["对华半导体设备出口管制（2023年7月生效）","《外汇与外贸法》——武器级技术出口限制"],
      specialNotes: "日本对华半导体设备出口管制与荷兰、美国协调实施。",
      tradeAgreement: "RCEP（区域全面经济伙伴关系协定）——部分商品关税减免"
    },
    "KR": {
      name: "韩国",
      keyRequirements: ["KC认证（安全/电磁兼容）","KCC认证（通信设备）","K-REACH（化学品注册）"],
      importRestrictions: ["对华半导体设备出口管制（2023年生效）","《外汇交易法》——战略性技术出口限制"],
      specialNotes: "RCEP下部分商品享有关税优惠，但高科技产品受限。",
      tradeAgreement: "RCEP + 中韩FTA"
    },
    "AU": {
      name: "澳大利亚",
      keyRequirements: ["RCM标志（电气安全/电磁兼容）","TGA认证（药品/医疗器械）","APVMA（农药/兽药）"],
      importRestrictions: ["对华钢铁反倾销措施","生物安全法——严格的农产品检疫"],
      specialNotes: "对华关系波动可能影响贸易政策，建议关注反倾销调查。",
      tradeAgreement: "中澳FTA（已升级，部分关税减免）"
    },
    "AE": {
      name: "阿联酋",
      keyRequirements: ["ECAS认证（阿联酋符合性评估）","TRA认证（电信设备）","Halal认证（清真食品）"],
      importRestrictions: ["对华钢铁反倾销","部分电子产品需符合GCC标准"],
      specialNotes: "迪拜是转口贸易中心，但需确保最终目的地不违反制裁。",
      tradeAgreement: "中阿FTA谈判中"
    },
    "SG": {
      name: "新加坡",
      keyRequirements: ["IMDA认证（信息通信设备）","PSB认证（消费品安全）","HSA认证（健康产品）"],
      importRestrictions: ["《战略物资管制法》——军民两用物项出口许可","对华技术出口管制协调"],
      specialNotes: "作为区域仲裁中心，新加坡是制裁风险回避的理想选择。",
      tradeAgreement: "中新FTA升级版（2023年生效）——全面关税减免"
    },
    "IN": {
      name: "印度",
      keyRequirements: ["BIS认证（强制性产品认证）","WPC认证（无线设备）","CDSCO认证（药品/医疗器械）"],
      importRestrictions: ["对华钢铁、化工、电子产品反倾销税","《武器与弹药法》——军民两用技术限制","PLI计划（生产关联激励）——本地生产优先"],
      specialNotes: "印度市场保护主义倾向增强，中国产品面临较高关税壁垒。",
      tradeAgreement: "RCEP（印度未加入）——无特殊优惠"
    },
    "BR": {
      name: "巴西",
      keyRequirements: ["INMETRO认证（强制性产品认证）","ANATEL认证（电信设备）","ANVISA认证（健康产品）"],
      importRestrictions: ["对华钢铁、化工反倾销税","亚马逊雨林保护——木材/农产品限制"],
      specialNotes: "巴西市场进入门槛较高，认证流程长，建议提前6-12个月准备。",
      tradeAgreement: "无双边自贸协定（中国）"
    },
    "MX": {
      name: "墨西哥",
      keyRequirements: ["NOM认证（墨西哥官方标准）","IFT认证（电信设备）","COFEPRIS认证（健康产品）"],
      importRestrictions: ["美墨加协定(USMCA)原产地规则——需满足区域价值含量","钢铁/铝232关税——对美出口需关注"],
      specialNotes: "墨西哥作为美国近岸外包替代方案，但中国产品需注意USMCA原产地规则。",
      tradeAgreement: "无双边自贸协定（中国），但可通过RCEP间接受益"
    },
    "RU": {
      name: "俄罗斯",
      keyRequirements: ["GOST-R认证（国家标准）","FAC认证（通信设备）","EAC标志（欧亚经济联盟）"],
      importRestrictions: ["⚠️ 美国/欧盟全面制裁——SWIFT切断、金融封锁","⚠️ 出口管制——军民两用技术绝对禁止","⚠️ 二级制裁风险——非美国实体也可能受罚"],
      specialNotes: "强烈建议暂停对俄贸易，除非有明确的制裁合规方案。",
      tradeAgreement: "欧亚经济联盟(EAEU)——成员国间关税减免"
    },
    "IR": {
      name: "伊朗",
      keyRequirements: ["INSO认证（国家标准）","CRA认证（通信设备）"],
      importRestrictions: ["⚠️ 美国全面制裁——绝对禁止贸易（少数例外）","⚠️ SWIFT切断——金融通道封锁","⚠️ 石油禁运——能源相关产品禁止"],
      specialNotes: "除人道主义物资（食品、药品、医疗设备）外，强烈建议避免对伊贸易。",
      tradeAgreement: "无"
    }
  };

  // --------------------------------------------------------
  // 3. 产品-ECCN 匹配引擎
  // --------------------------------------------------------
  function matchProductToECCN(productDescription) {
    if (!productDescription) return [];
    const desc = productDescription.toLowerCase();
    const matches = [];

    const keywords = {
      "3A001": ["处理器", "processor", "cpu", "微电路", "microcircuit", "集成电路", "ic", "芯片", "chip"],
      "3A090": ["ai芯片", "gpu", "人工智能", "artificial intelligence", "深度学习", "deep learning", "神经网络", "neural network", "先进计算"],
      "3A991": ["电子元件", "电阻", "电容", "二极管", "transistor", "普通芯片"],
      "3E001": ["半导体技术", "光刻", "lithography", "制造工艺", "process technology", "28nm", "7nm", "5nm"],
      "4A003": ["计算机", "computer", "服务器", "server", "高性能计算", "hpc", "超级计算机", "supercomputer"],
      "5A002": ["加密", "encryption", "网络安全", "cybersecurity", "防火墙", "firewall", "vpn", "信息安全"],
      "5A992": ["路由器", "router", "交换机", "switch", "通信设备", "telecom equipment", "基站", "base station"],
      "6A003": ["摄像头", "camera", "红外", "infrared", "夜视", "night vision", "光学", "optical", "监控"],
      "7A001": ["导航", "navigation", "gps", "惯性导航", "ins", "航空电子", "avionics", "无人机", "drone", "uav"],
      "9A515": ["卫星", "satellite", "火箭", "rocket", "航天器", "spacecraft", "航天", "aerospace"],
      "0A979": ["军事训练", "military training", "仿真", "simulation", "模拟器", "simulator"],
      "EAR99": ["普通消费品", "consumer goods", "日用品", "服装", "clothing", "家具", "furniture", "玩具", "toy"]
    };

    for (const [eccn, words] of Object.entries(keywords)) {
      const score = words.filter(w => desc.includes(w)).length;
      if (score > 0) {
        matches.push({ code: eccn, score: score, ...ECCN_DATABASE[eccn] });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 5);
  }

  // --------------------------------------------------------
  // 4. 准入查询主函数
  // --------------------------------------------------------
  function queryMarketAccess(productDescription, targetCountry, exportCountry) {
    const eccnMatches = matchProductToECCN(productDescription);
    const market = MARKET_ACCESS_DB[targetCountry.toUpperCase()];

    if (!market) {
      return {
        valid: false,
        error: `未收录目标市场 ${targetCountry} 的数据。支持的市场：${Object.keys(MARKET_ACCESS_DB).join(', ')}`
      };
    }

    // 评估出口管制风险
    const exportControlRisk = assessExportControlRisk(eccnMatches, targetCountry);

    // 生成认证清单
    const certificationChecklist = generateCertificationChecklist(market, eccnMatches);

    // 总体风险评估
    const overallRisk = calculateOverallRisk(exportControlRisk, market);

    return {
      valid: true,
      queryTime: new Date().toISOString(),
      productDescription: productDescription,
      targetCountry: { code: targetCountry.toUpperCase(), name: market.name },
      exportCountry: exportCountry || "CN",
      eccnAnalysis: {
        matchedECCN: eccnMatches,
        primaryRecommendation: eccnMatches.length > 0 ? `产品可能属于 ${eccnMatches[0].code}（${eccnMatches[0].desc}），建议确认准确ECCN分类` : "无法自动匹配ECCN，建议咨询专业出口管制律师进行产品分类"
      },
      exportControl: exportControlRisk,
      marketAccess: {
        keyRequirements: market.keyRequirements,
        importRestrictions: market.importRestrictions,
        specialNotes: market.specialNotes,
        tradeAgreement: market.tradeAgreement
      },
      certificationChecklist: certificationChecklist,
      overallRisk: overallRisk
    };
  }

  function assessExportControlRisk(eccnMatches, targetCountry) {
    const countryRisk = {
      "RU": "comprehensive", "IR": "comprehensive", "KP": "comprehensive", "SY": "comprehensive",
      "BY": "comprehensive", "MM": "sectoral", "VE": "sectoral", "CU": "embargo"
    }[targetCountry.toUpperCase()] || "none";

    if (countryRisk === "comprehensive") {
      return {
        level: "critical",
        reason: "目标国家受到全面制裁，EAR全面禁运适用",
        licenseRequired: true,
        licenseType: "全面禁运——通常无法获得许可",
        legalBasis: "EAR 15 CFR 746 + 各制裁项目",
        recommendation: "⚠️ 强烈建议暂停交易。如需维持，必须申请OFAC特定许可（成功率极低）"
      };
    }

    if (eccnMatches.length === 0) {
      return {
        level: "low",
        reason: "产品未匹配到受控ECCN，可能属于EAR99或不受EAR管辖",
        licenseRequired: false,
        licenseType: "无需许可证",
        legalBasis: "EAR 15 CFR 734.3 + 734.4",
        recommendation: "✅ 常规出口即可，但需确认最终用户和最终用途"
      };
    }

    const topMatch = eccnMatches[0];
    const hasCritical = eccnMatches.some(m => m.riskLevel === "critical");
    const hasHigh = eccnMatches.some(m => m.riskLevel === "high");

    if (hasCritical || countryRisk === "sectoral") {
      return {
        level: "critical",
        reason: `产品属于 ${topMatch.code}（${topMatch.desc}），为高风险受控物项`,
        licenseRequired: true,
        licenseType: "出口许可证（Export License）",
        legalBasis: topMatch.controlReason,
        recommendation: `⚠️ 必须向BIS申请出口许可证。如产品含美国技术成分，还需评估外国直接产品规则(FDPR)适用性。`
      };
    }

    if (hasHigh) {
      return {
        level: "high",
        reason: `产品属于 ${topMatch.code}（${topMatch.desc}），需出口许可`,
        licenseRequired: true,
        licenseType: "出口许可证或许可例外",
        legalBasis: topMatch.controlReason,
        recommendation: `🔍 需向BIS申请出口许可证，或确认是否符合许可例外条件（如${topMatch.licenseException?.join('/')}）`
      };
    }

    return {
      level: "low",
      reason: `产品属于 ${topMatch.code}（${topMatch.desc}），风险较低`,
      licenseRequired: false,
      licenseType: "无需许可证或适用许可例外",
      legalBasis: topMatch.controlReason,
      recommendation: "✅ 常规出口即可，建议使用BIS的SNAP-R系统在线申请许可例外确认"
    };
  }

  function generateCertificationChecklist(market, eccnMatches) {
    const checklist = [];

    // 基础认证要求
    for (const req of market.keyRequirements) {
      checklist.push({ category: "强制性认证", item: req, required: true, estimatedTime: "3-6个月", priority: "high" });
    }

    // 出口管制相关
    if (eccnMatches.some(m => m.riskLevel === "critical" || m.riskLevel === "high")) {
      checklist.push({ category: "出口管制", item: "BIS出口许可证申请", required: true, estimatedTime: "90-180天", priority: "critical" });
      checklist.push({ category: "出口管制", item: "最终用户/最终用途声明（End-Use Statement）", required: true, estimatedTime: "7-14天", priority: "high" });
    }

    // 制裁合规
    checklist.push({ category: "制裁合规", item: "交易对手筛查（SDN/Entity List/UVL）", required: true, estimatedTime: "1-3天", priority: "critical" });
    checklist.push({ category: "制裁合规", item: "供应链溯源（UFLPA合规）", required: true, estimatedTime: "1-2个月", priority: "high" });

    return checklist;
  }

  function calculateOverallRisk(exportControl, market) {
    let score = 0;
    if (exportControl.level === "critical") score += 60;
    if (exportControl.level === "high") score += 40;
    if (market.importRestrictions.some(r => r.includes("⚠️"))) score += 30;
    if (market.importRestrictions.length > 2) score += 10;

    const level = score >= 70 ? "critical" : score >= 40 ? "high" : score >= 20 ? "medium" : "low";
    return { score: Math.min(100, score), level: level, label: level === "critical" ? "极高风险" : level === "high" ? "高风险" : level === "medium" ? "中风险" : "低风险" };
  }

  // --------------------------------------------------------
  // 5. 暴露到全局
  // --------------------------------------------------------
  window.LawFlowAccessQuery = {
    queryMarketAccess: queryMarketAccess,
    matchProductToECCN: matchProductToECCN,
    eccnDatabase: ECCN_DATABASE,
    marketDatabase: MARKET_ACCESS_DB,
    version: "2.0.0-legal",
    lastUpdated: "2025-06-28"
  };

  console.log('[LawFlow] 准入查询增强模块 v2.0 已加载');
  console.log(`[LawFlow] ECCN分类: ${Object.keys(ECCN_DATABASE).length} 条`);
  console.log(`[LawFlow] 市场准入: ${Object.keys(MARKET_ACCESS_DB).length} 个市场`);

})();
