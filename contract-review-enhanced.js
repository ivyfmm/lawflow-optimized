// ============================================================
// LawFlow AI - 合同审查增强模块 v2.0
// 法律人逻辑：条款完整性 → 风险识别 → 修改建议 → 模板生成
// ============================================================

(function() {
  'use strict';

  const CONTRACT_REVIEW_RULES = {
    sanctions: {
      category: "制裁合规",
      priority: "critical",
      rules: [
        {
          id: "SAN-001",
          name: "制裁清单声明条款",
          description: "合同双方应声明不在任何制裁清单上",
          checkPatterns: [/制裁|sanction|SDN|OFAC|Entity List|实体清单/i],
          antiPatterns: [/双方声明.*不在.*制裁|各方确认.*未列入.*名单|非制裁实体|not sanctioned/i],
          riskLevel: "critical",
          legalBasis: "《反外国制裁法》第12条、EO 13224/13850/14024、31 CFR 501",
          missingRisk: "如交易对手事后被列入制裁清单，合同可能被冻结且无法追偿",
          suggestion: "在合同前言或定义条款中加入制裁清单声明",
          template: `双方声明并保证：\n1. 截至本合同签署日，任何一方及其控股股东、实际控制人、关键管理人员均未被列入联合国、美国（OFAC SDN/Entity List/CMIC）、欧盟、英国或其他司法管辖区的制裁清单；\n2. 任何一方不得在本合同履行期间从事任何可能导致对方违反制裁法律法规的行为；\n3. 如任何一方在合同履行期间被列入制裁清单，另一方有权立即终止合同且不承担违约责任。`
        },
        {
          id: "SAN-002",
          name: "出口管制合规条款",
          description: "涉及技术/产品出口需确认ECCN分类及许可要求",
          checkPatterns: [/出口管制|export control|EAR|ECCN|ITAR|瓦森纳|Wassenaar/i],
          antiPatterns: [/ECCN分类|出口管制分类|许可要求|license requirement|受控物项/i],
          riskLevel: "high",
          legalBasis: "EAR 15 CFR 730-774、ITAR 22 CFR 120-130",
          missingRisk: "产品可能属于受控物项而未获取出口许可，导致违反美国出口管制法",
          suggestion: "加入出口管制分类条款，明确产品ECCN分类、是否需许可证、及许可证获取责任方",
          template: `1. 卖方确认，本合同项下产品/技术的出口管制分类编号（ECCN）为____；\n2. 如产品/技术属于受控物项，卖方负责在交付前获取所有必要的出口许可证；\n3. 买方确认，产品/技术的最终用途、最终用户及最终目的地符合所有适用的出口管制法规；\n4. 任何一方违反出口管制法规导致对方遭受损失的，应承担赔偿责任。`
        },
        {
          id: "SAN-003",
          name: "反规避条款",
          description: "禁止通过第三方规避制裁",
          checkPatterns: [/规避|circumvent|evade|间接交易|第三方/i],
          antiPatterns: [/禁止.*规避|不得.*间接|反规避|anti-circumvention/i],
          riskLevel: "high",
          legalBasis: "31 CFR 501.603、EO 14024",
          missingRisk: "交易可能通过空壳公司或第三方被用于规避制裁，导致连带责任",
          suggestion: "加入反规避条款，禁止通过关联方或第三方进行被制裁交易",
          template: `任何一方不得通过其关联方、子公司、代理人或其他第三方从事任何旨在规避适用制裁法律法规的交易或活动。任何违反本条款的行为视为对本合同的根本违约。`
        }
      ]
    },
    disputeResolution: {
      category: "争议解决",
      priority: "high",
      rules: [
        {
          id: "DR-001",
          name: "仲裁条款（制裁风险回避）",
          description: "避免美国法院管辖，优先选择中立仲裁机构",
          checkPatterns: [/争议解决|dispute resolution|arbitration|仲裁|诉讼|litigation|管辖|jurisdiction/i],
          antiPatterns: [/仲裁|SIAC|HKIAC|ICC|CIETAC|LCIA|UNCITRAL/i],
          riskLevel: "high",
          legalBasis: "《纽约公约》、UNCITRAL",
          missingRisk: "选择美国法院管辖可能导致合同被冻结、资产被扣押，且美国法院可能适用制裁法否定合同效力",
          suggestion: "优先选择SIAC、HKIAC或CIETAC，适用中国法或英国法",
          template: `因本合同引起的或与本合同有关的任何争议，应首先通过友好协商解决。协商不成的，任何一方均可将争议提交【新加坡国际仲裁中心(SIAC)/香港国际仲裁中心(HKIAC)/中国国际经济贸易仲裁委员会(CIETAC)】按其届时有效的仲裁规则进行仲裁。仲裁地为【新加坡/香港/北京】，仲裁语言为【中文/英文】，适用【中华人民共和国/英格兰与威尔士】法律。`
        },
        {
          id: "DR-002",
          name: "法律适用条款",
          description: "明确选择适用的准据法",
          checkPatterns: [/适用.*法|governing law|applicable law|准据法|法律适用/i],
          antiPatterns: [/适用.*法|governing law/i],
          riskLevel: "medium",
          legalBasis: "《民法典》第467条、国际私法冲突规范",
          missingRisk: "未约定准据法可能导致适用美国法（基于最低联系原则），增加制裁合规风险",
          suggestion: "明确约定适用中国法或英国法（非美国法）",
          template: `本合同的订立、效力、解释、履行及争议解决均适用【中华人民共和国法律/英格兰与威尔士法律】（不包括其冲突法规则）。`
        }
      ]
    },
    forceMajeure: {
      category: "不可抗力",
      priority: "high",
      rules: [
        {
          id: "FM-001",
          name: "制裁纳入不可抗力定义",
          description: "将制裁作为不可抗力事件明确列出",
          checkPatterns: [/不可抗力|force majeure|不可预见|不能避免|不能克服/i],
          antiPatterns: [/制裁.*不可抗力|sanction.*force majeure|法律变更.*不可抗力|政府行为.*不可抗力/i],
          riskLevel: "high",
          legalBasis: "《民法典》第180条、第533条（情势变更）",
          missingRisk: "制裁通常不被法院自动认定为不可抗力，需合同明确约定",
          suggestion: "在不可抗力定义中明确列举制裁、禁运、法律变更等事件",
          template: `不可抗力事件包括但不限于：战争、暴乱、自然灾害、流行病、政府行为、法律法规变更、制裁、禁运、进出口限制、以及任何一方被列入制裁清单导致无法履行合同义务的情形。任何一方因不可抗力事件无法履行合同的，应及时通知对方并提供相关证明。`
        }
      ]
    },
    payment: {
      category: "支付条款",
      priority: "high",
      rules: [
        {
          id: "PAY-001",
          name: "货币与支付通道风险",
          description: "美元结算和SWIFT通道的制裁风险",
          checkPatterns: [/美元|USD|\$|美元结算|SWIFT|支付|payment|currency/i],
          antiPatterns: [/人民币|RMB|CNY|欧元|EUR|英镑|GBP|本币|local currency|替代支付|alternative payment/i],
          riskLevel: "high",
          legalBasis: "31 CFR 501（OFAC）、SWIFT切断指令",
          missingRisk: "美元结算通过美国银行，即使交易本身不违法，也可能因银行合规审查导致资金冻结",
          suggestion: "如涉及制裁风险国家，建议改用人民币(CIPS)、欧元(SEPA)或本币结算",
          template: `1. 本合同项下款项应以【人民币/欧元/本币】支付，通过【CIPS/SEPA/银企直连】进行结算；\n2. 如必须使用美元支付，双方确认该支付符合所有适用的制裁法律法规；\n3. 因银行合规审查或制裁原因导致资金冻结的，双方应协商替代支付方案，任何一方不承担违约责任。`
        }
      ]
    },
    intellectualProperty: {
      category: "知识产权",
      priority: "medium",
      rules: [
        {
          id: "IP-001",
          name: "技术出口与知识产权转让限制",
          description: "技术转让可能触发出口管制",
          checkPatterns: [/知识产权|intellectual property|IP|专利|patent|技术转让|technology transfer|know-how/i],
          antiPatterns: [/出口管制.*知识产权|技术转让.*许可|IP.*export control/i],
          riskLevel: "medium",
          legalBasis: "EAR 15 CFR 734.7、ITAR 22 CFR 120.17",
          missingRisk: "技术转让（包括 know-how、培训、文档）可能构成EAR定义下的「出口」，需许可证",
          suggestion: "在技术转让条款中加入出口管制合规审查义务",
          template: `1. 任何技术转让（包括专利、专有技术、技术文档、培训）均应事先进行出口管制合规审查；\n2. 如技术转让属于EAR或ITAR管辖范围，转让方应在转让前获取必要的出口许可证；\n3. 受让方不得将受让技术向任何受制裁国家或实体进行再出口或再转让。`
        }
      ]
    },
    liability: {
      category: "违约责任",
      priority: "medium",
      rules: [
        {
          id: "LIA-001",
          name: "制裁导致的免责条款",
          description: "因制裁导致的履行障碍应免责",
          checkPatterns: [/违约|breach|liability|赔偿|damages|责任|responsibility/i],
          antiPatterns: [/制裁.*免责|法律变更.*免责|不可抗力.*免责|制裁.*不承担责任/i],
          riskLevel: "medium",
          legalBasis: "《民法典》第590条、情势变更原则",
          missingRisk: "未约定制裁免责可能导致一方因制裁无法履行但仍需承担违约责任",
          suggestion: "在违约责任条款中明确排除因制裁、法律变更导致的履行障碍",
          template: `任何一方因适用制裁法律法规、政府禁令或法律变更导致无法履行或迟延履行合同义务的，不构成违约，不承担违约责任，但应及时通知对方并采取合理措施减少损失。`
        }
      ]
    },
    termination: {
      category: "合同终止",
      priority: "medium",
      rules: [
        {
          id: "TERM-001",
          name: "制裁触发终止权",
          description: "一方被列入制裁清单时另一方有权终止",
          checkPatterns: [/终止|termination|解除|rescind|cancel|提前终止|early termination/i],
          antiPatterns: [/制裁.*终止|清单.*终止|法律变更.*终止|一方.*制裁.*另一方.*终止/i],
          riskLevel: "medium",
          legalBasis: "《民法典》第563条（合同解除权）、EO 13936",
          missingRisk: "合同未约定制裁触发终止权，可能导致被迫继续与制裁实体交易",
          suggestion: "加入制裁触发终止条款，赋予非制裁方单方终止权",
          template: `如任何一方在合同履行期间被联合国、美国、欧盟、英国或任何其他司法管辖区列入制裁清单，或任何一方的控股股东、实际控制人被列入制裁清单，另一方有权立即书面通知终止本合同，且不承担任何违约责任。合同终止后，双方应就已履行部分进行结算。`
        }
      ]
    }
  };

  function reviewContract(contractText) {
    if (!contractText || contractText.trim().length < 50) {
      return { valid: false, error: "合同文本过短，无法进行分析。请提供完整的合同文本。" };
    }

    const findings = [];
    const missingClauses = [];
    const presentClauses = [];
    let totalRiskScore = 0;
    let criticalCount = 0, highCount = 0, mediumCount = 0;

    for (const [categoryKey, category] of Object.entries(CONTRACT_REVIEW_RULES)) {
      for (const rule of category.rules) {
        const hasRelevantKeywords = rule.checkPatterns.some(p => p.test(contractText));
        const hasAntiPattern = rule.antiPatterns.some(p => p.test(contractText));

        if (hasRelevantKeywords || hasAntiPattern) {
          if (hasAntiPattern) {
            presentClauses.push({ id: rule.id, name: rule.name, category: category.category, status: "present", riskLevel: "low" });
          } else {
            const riskScore = rule.riskLevel === "critical" ? 100 : rule.riskLevel === "high" ? 70 : 40;
            totalRiskScore += riskScore;
            if (rule.riskLevel === "critical") criticalCount++;
            if (rule.riskLevel === "high") highCount++;
            if (rule.riskLevel === "medium") mediumCount++;

            missingClauses.push({ id: rule.id, name: rule.name, category: category.category, priority: category.priority, riskLevel: rule.riskLevel, description: rule.description, legalBasis: rule.legalBasis, missingRisk: rule.missingRisk, suggestion: rule.suggestion, template: rule.template, status: "missing" });
            findings.push({ id: rule.id, category: category.category, name: rule.name, riskLevel: rule.riskLevel, description: rule.description, legalBasis: rule.legalBasis, missingRisk: rule.missingRisk, suggestion: rule.suggestion });
          }
        }
      }
    }

    const maxScore = Object.values(CONTRACT_REVIEW_RULES).flatMap(c => c.rules).length * 100;
    const normalizedScore = Math.min(100, Math.round(totalRiskScore / Math.max(1, maxScore / 5) * 100));
    const overallLevel = normalizedScore >= 80 ? "critical" : normalizedScore >= 60 ? "high" : normalizedScore >= 40 ? "medium" : "low";

    const overallRecommendations = generateOverallRecommendations(missingClauses, presentClauses);
    const templateDocument = generateTemplateDocument(missingClauses);

    return {
      valid: true,
      scanTime: new Date().toISOString(),
      summary: { totalClauses: findings.length + presentClauses.length, missingClauses: missingClauses.length, presentClauses: presentClauses.length, criticalCount, highCount, mediumCount, overallRiskScore: normalizedScore, overallRiskLevel: overallLevel, overallLabel: overallLevel === "critical" ? "极高风险" : overallLevel === "high" ? "高风险" : overallLevel === "medium" ? "中风险" : "低风险" },
      findings, missingClauses, presentClauses, overallRecommendations, templateDocument
    };
  }

  function generateOverallRecommendations(missing, present) {
    const recommendations = [];
    if (missing.length === 0) {
      recommendations.push({ priority: "low", title: "合同合规性良好", desc: "已检测到主要制裁合规条款，建议定期复核。" });
    } else {
      const criticalMissing = missing.filter(m => m.riskLevel === "critical");
      const highMissing = missing.filter(m => m.riskLevel === "high");
      if (criticalMissing.length > 0) recommendations.push({ priority: "critical", title: `紧急：缺失 ${criticalMissing.length} 个关键条款`, desc: `以下条款对制裁合规至关重要：${criticalMissing.map(m => m.name).join('、')}` });
      if (highMissing.length > 0) recommendations.push({ priority: "high", title: `重要：缺失 ${highMissing.length} 个高风险条款`, desc: `建议尽快补充：${highMissing.map(m => m.name).join('、')}` });
      recommendations.push({ priority: "high", title: "建议聘请专业律师复核", desc: "本审查为AI初步扫描，不能替代专业律师的完整合同审查。" });
    }
    return recommendations;
  }

  function generateTemplateDocument(missingClauses) {
    if (missingClauses.length === 0) return "所有关键条款已存在，无需补充。";
    const grouped = {};
    for (const clause of missingClauses) { if (!grouped[clause.category]) grouped[clause.category] = []; grouped[clause.category].push(clause); }
    let doc = "# 合同补充条款建议\n\n";
    for (const [category, clauses] of Object.entries(grouped)) {
      doc += `## ${category}\n\n`;
      for (const clause of clauses) {
        doc += `### ${clause.name}（${clause.riskLevel === 'critical' ? '⚠️ 极高风险' : clause.riskLevel === 'high' ? '🔴 高风险' : '🟡 中风险'}）\n\n`;
        doc += `**条款描述：** ${clause.description}\n\n`;
        doc += `**法律依据：** ${clause.legalBasis}\n\n`;
        doc += `**风险提示：** ${clause.missingRisk}\n\n`;
        doc += `**建议修改：** ${clause.suggestion}\n\n`;
        doc += `**参考模板：**\n\n${clause.template}\n\n---\n\n`;
      }
    }
    return doc;
  }

  window.LawFlowContractReview = {
    reviewContract: reviewContract,
    rules: CONTRACT_REVIEW_RULES,
    version: "2.0.0-legal",
    lastUpdated: "2025-06-28"
  };

  console.log('[LawFlow] 合同审查增强模块 v2.0 已加载');
})();