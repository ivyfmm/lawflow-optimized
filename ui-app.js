// ============================================================
// LawFlow AI - UI应用逻辑（合并版）
// 包含：制裁扫描、法律护盾、合同审查、准入查询、合规助手
// ============================================================

const selectedConnections = new Set();

// Tab切换
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
  });
});

// 连接点多选
document.querySelectorAll('.connection-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const id = tag.dataset.id;
    if (selectedConnections.has(id)) {
      selectedConnections.delete(id);
      tag.classList.remove('active');
    } else {
      selectedConnections.add(id);
      tag.classList.add('active');
    }
  });
});

// ============================================================
// 1. 制裁扫描
// ============================================================
document.getElementById('btn-scan').addEventListener('click', () => {
  const country = document.getElementById('scan-country').value;
  if (!country) { alert('请选择目标国家'); return; }
  const report = window.LawFlowSanctionEnhanced.generateSanctionReport(
    country,
    document.getElementById('scan-product').value,
    document.getElementById('scan-entity').value,
    Array.from(selectedConnections)
  );
  displayScanResult(report);
  prepareLawShield(report);
});

function displayScanResult(report) {
  document.getElementById('scan-placeholder').style.display = 'none';
  document.getElementById('scan-result').style.display = 'block';
  document.getElementById('scan-time').textContent = '扫描时间: ' + new Date().toLocaleString();
  const scoreEl = document.getElementById('risk-score'), labelEl = document.getElementById('risk-label');
  scoreEl.textContent = report.overallRisk.score;
  scoreEl.className = 'risk-score risk-' + report.overallRisk.level;
  labelEl.textContent = report.overallRisk.label;
  labelEl.className = 'text-lg font-semibold mt-2 risk-' + report.overallRisk.level;
  document.getElementById('risk-factors').innerHTML = report.riskFactors.map(f =>
    `<div class="flex justify-between items-center"><span class="text-sm text-gray-600">${f.factor}</span><div class="flex items-center gap-2"><div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-${f.level === 'critical' ? 'red-600' : f.level === 'high' ? 'orange-500' : f.level === 'medium' ? 'yellow-500' : 'green-500'}" style="width:${f.score}%"></div></div><span class="text-sm font-medium w-8 text-right">${f.score}</span></div></div>`
  ).join('');
  const detailsEl = document.getElementById('scan-details');
  let detailsHTML = '';
  if (report.countryScan) {
    const cs = report.countryScan;
    detailsHTML += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">国家风险: ${cs.countryRisk?.countryName || ''}</h4><div class="space-y-2">${cs.countryRisk?.reasons?.map(r => `<div class="text-sm text-gray-600 flex items-start gap-2"><span class="text-red-500 mt-0.5">⚠</span>${r}</div>`).join('') || ''}</div>${cs.recommendations?.length ? `<div class="mt-4 p-4 bg-blue-50 rounded-lg"><div class="text-sm font-medium text-blue-900 mb-2">建议</div>${cs.recommendations.map(r => `<div class="text-sm text-blue-800">${r}</div>`).join('')}</div>` : ''}</div>`;
  }
  if (report.entitySearch?.length > 0) {
    detailsHTML += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">实体匹配结果 (${report.entitySearch.length})</h4><div class="space-y-3">${report.entitySearch.map(e => `<div class="entity-card ${e.riskLevel}"><div class="flex justify-between items-start"><div><div class="font-semibold text-gray-900">${e.name}</div><div class="text-sm text-gray-500">${e.aliases?.join(' / ') || ''}</div></div><span class="text-xs px-2 py-1 rounded ${e.riskLevel === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">${e.riskLevel === 'critical' ? 'CRITICAL' : 'HIGH'}</span></div><div class="text-sm text-gray-600 mt-2"><span class="font-medium">清单:</span> ${e.lists?.join(', ') || 'Unknown'} | <span class="font-medium">国家:</span> ${e.country || 'Unknown'}</div></div>`).join('')}</div></div>`;
  }
  if (report.connectionPointAnalysis) {
    const cpa = report.connectionPointAnalysis;
    detailsHTML += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">连接点分析</h4><div class="grid grid-cols-2 md:grid-cols-4 gap-3">${cpa.riskFactors?.map(f => `<div class="p-3 rounded-lg ${f.level === 'critical' ? 'bg-red-50' : f.level === 'high' ? 'bg-orange-50' : 'bg-green-50'} border ${f.level === 'critical' ? 'border-red-200' : f.level === 'high' ? 'border-orange-200' : 'border-green-200'}"><div class="text-xs text-gray-500">${f.factor}</div><div class="text-lg font-bold ${f.level === 'critical' ? 'text-red-600' : f.level === 'high' ? 'text-orange-600' : 'text-green-600'}">${f.score}</div></div>`).join('') || ''}</div></div>`;
  }
  if (report.exportControlAnalysis) {
    const ec = report.exportControlAnalysis;
    detailsHTML += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">出口管制分析</h4><div class="space-y-2">${ec.eccnClassification ? `<div class="text-sm"><span class="font-medium">ECCN分类:</span> ${ec.eccnClassification}</div>` : ''}${ec.licenseRequirement ? `<div class="text-sm"><span class="font-medium">许可要求:</span> ${ec.licenseRequirement}</div>` : ''}${ec.usContentPercentage ? `<div class="text-sm"><span class="font-medium">美国成分:</span> ${ec.usContentPercentage}</div>` : ''}</div></div>`;
  }
  detailsEl.innerHTML = detailsHTML;
}

// ============================================================
// 2. 法律护盾
// ============================================================
function prepareLawShield(report) {
  const shield = window.LawFlowLawShieldEnhanced.generateLawShield(report, { country: 'CN' });
  const container = document.getElementById('shield-content');
  let html = `<div class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-white rounded-xl p-4 border border-gray-200 text-center"><div class="text-sm text-gray-500">综合风险</div><div class="text-2xl font-bold ${shield.riskSummary.overallScore >= 60 ? 'text-red-600' : 'text-orange-500'}">${shield.riskSummary.overallScore}分</div></div><div class="bg-white rounded-xl p-4 border border-gray-200 text-center"><div class="text-sm text-gray-500">匹配工具</div><div class="text-2xl font-bold text-indigo-600">${shield.applicableTools}个</div></div><div class="bg-white rounded-xl p-4 border border-gray-200 text-center"><div class="text-sm text-gray-500">合规检查项</div><div class="text-2xl font-bold text-green-600">${shield.complianceChecklist.length}项</div></div></div>`;
  html += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h3 class="section-title">整体建议</h3><div class="space-y-3">${shield.overallRecommendations.map(r => `<div class="p-4 rounded-lg ${r.priority === 'critical' ? 'bg-red-50 border border-red-200' : r.priority === 'high' ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}"><div class="flex items-center gap-2 mb-1"><span class="px-2 py-0.5 rounded text-xs font-semibold ${r.priority === 'critical' ? 'bg-red-200 text-red-800' : r.priority === 'high' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}">${r.priority === 'critical' ? '紧急' : r.priority === 'high' ? '高优' : '建议'}</span><span class="font-semibold text-gray-900">${r.title}</span></div><div class="text-sm text-gray-600 mb-2">${r.desc}</div><div class="text-sm font-medium text-indigo-700">行动: ${r.action}</div></div>`).join('')}</div></div>`;
  html += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h3 class="section-title">行动方案</h3>${shield.timeline.immediate.length ? `<div class="timeline-section"><div class="timeline-title"><span class="timeline-dot immediate"></span>立即行动（0-7天）</div><div class="space-y-4">${shield.timeline.immediate.map(a => renderToolCard(a)).join('')}</div></div>` : ''}${shield.timeline.shortTerm.length ? `<div class="timeline-section"><div class="timeline-title"><span class="timeline-dot short"></span>短期行动（1-4周）</div><div class="space-y-4">${shield.timeline.shortTerm.map(a => renderToolCard(a)).join('')}</div></div>` : ''}${shield.timeline.longTerm.length ? `<div class="timeline-section"><div class="timeline-title"><span class="timeline-dot long"></span>长期行动（1-6个月）</div><div class="space-y-4">${shield.timeline.longTerm.map(a => renderToolCard(a)).join('')}</div></div>` : ''}</div>`;
  html += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h3 class="section-title">合规检查清单</h3><div class="space-y-2">${shield.complianceChecklist.map(c => `<div class="checklist-item"><div class="check-box"></div><div><div class="text-sm font-medium text-gray-900">${c.item}</div><div class="text-xs text-gray-500">${c.category} | ${c.timeframe}</div></div></div>`).join('')}</div></div>`;
  html += `<div class="bg-white rounded-xl p-6 border border-gray-200"><h3 class="section-title">文书模板</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-3">${shield.documentTemplates.map(t => `<div class="template-card"><div class="font-semibold text-gray-900 text-sm">${t.name}</div><div class="text-xs text-gray-500 mt-1">${t.description}</div></div>`).join('')}</div></div></div>`;
  container.innerHTML = html;
  container.classList.remove('placeholder-box');
}

function renderToolCard(action) {
  return `<div class="tool-card"><div class="tool-header"><div><div class="tool-category">${action.category}</div><div class="font-semibold text-gray-900 mt-1">${action.toolName}</div></div><span class="success-rate">成功率: ${action.successRate}</span></div><div class="text-sm text-gray-600 mb-3"><span class="font-medium">法律依据:</span> ${action.legalBasis}</div><div class="text-sm text-gray-600 mb-3"><span class="font-medium">预计时间:</span> ${action.timeFrame}</div><div class="space-y-2 mb-3">${action.steps.map(s => `<div class="flex items-start gap-3 text-sm"><span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">${s.step}</span><span class="text-gray-700">${s.description}</span></div>`).join('')}</div><div class="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800"><span class="font-medium">⚠ 风险提示:</span> ${action.riskWarning}</div>${action.templates?.length ? `<div class="mt-3 flex flex-wrap gap-2">${action.templates.map(t => `<span class="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">${t.name}</span>`).join('')}</div>` : ''}</div>`;
}

// ============================================================
// 3. 合同审查（旧版基础逻辑）
// ============================================================
document.getElementById('btn-contract').addEventListener('click', () => {
  const text = document.getElementById('contract-text').value;
  if (!text.trim()) { alert('请输入合同文本'); return; }
  const risks = [];
  const checks = [
    { pattern: /制裁|sanction|OFAC|SDN/i, name: '制裁条款缺失', risk: 'high', suggestion: '建议加入制裁合规条款，明确双方不在制裁清单上的声明' },
    { pattern: /不可抗力|force majeure/i, name: '不可抗力条款', risk: 'medium', suggestion: '建议明确将「制裁」纳入不可抗力定义范围' },
    { pattern: /争议解决|arbitration|dispute resolution/i, name: '争议解决条款', risk: 'medium', suggestion: '建议优先选择仲裁（SIAC/HKIAC/CIETAC），避免美国法院管辖' },
    { pattern: /美元|\$|USD/i, name: '美元结算风险', risk: 'high', suggestion: '如交易涉及制裁风险国家，建议改用人民币或其他货币结算' },
    { pattern: /美国|USA|U\.S\./i, name: '美国法律连接点', risk: 'medium', suggestion: '评估美国法律适用是否带来制裁合规风险' },
    { pattern: /出口管制|export control|EAR|ECCN/i, name: '出口管制条款', risk: 'high', suggestion: '建议加入出口管制合规条款，明确ECCN分类义务' }
  ];
  checks.forEach(c => { if (c.pattern.test(text)) risks.push(c); });
  const resultEl = document.getElementById('contract-result');
  resultEl.classList.remove('placeholder-box');
  resultEl.innerHTML = `<div class="bg-white rounded-xl p-6 border border-gray-200 h-full"><h3 class="section-title">审查结果</h3><div class="mb-4"><div class="text-sm text-gray-500">扫描关键词</div><div class="text-2xl font-bold ${risks.length > 3 ? 'text-red-600' : risks.length > 0 ? 'text-orange-500' : 'text-green-600'}">${risks.length} 项</div></div><div class="space-y-3">${risks.length === 0 ? '<div class="text-green-600">✓ 未检测到明显高风险条款</div>' : ''}${risks.map(r => `<div class="p-4 ${r.risk === 'high' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'} rounded-lg"><div class="flex items-center gap-2 mb-1"><span class="px-2 py-0.5 rounded text-xs font-semibold ${r.risk === 'high' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}">${r.risk === 'high' ? '高风险' : '中风险'}</span><span class="font-semibold text-gray-900">${r.name}</span></div><div class="text-sm text-gray-700">${r.suggestion}</div></div>`).join('')}</div><div class="mt-6 p-4 bg-blue-50 rounded-lg"><div class="text-sm font-medium text-blue-900">💡 建议</div><div class="text-sm text-blue-800 mt-1">建议引入contract-review-enhanced.js增强版进行全面审查</div></div></div>`;
});

// ============================================================
// 4. 准入查询
// ============================================================
document.getElementById('btn-access').addEventListener('click', () => {
  const product = document.getElementById('access-product').value;
  const target = document.getElementById('access-target').value;
  if (!product || !target) { alert('请填写产品描述和目标市场'); return; }
  const result = window.LawFlowAccessQuery.queryMarketAccess(product, target, document.getElementById('access-export').value);
  displayAccessResult(result);
});

function displayAccessResult(result) {
  if (!result.valid) { alert(result.error); return; }
  document.getElementById('access-placeholder').style.display = 'none';
  document.getElementById('access-result').style.display = 'block';
  document.getElementById('access-time').textContent = '查询时间: ' + new Date().toLocaleString();
  const riskScore = document.getElementById('access-risk-score'), riskLabel = document.getElementById('access-risk-label');
  riskScore.textContent = result.overallRisk.score;
  riskScore.className = 'risk-score risk-' + result.overallRisk.level;
  riskLabel.textContent = result.overallRisk.label;
  riskLabel.className = 'text-lg font-semibold mt-2 risk-' + result.overallRisk.level;
  const eccnEl = document.getElementById('access-eccn');
  if (result.eccnAnalysis.matchedECCN.length > 0) {
    eccnEl.innerHTML = result.eccnAnalysis.matchedECCN.map(e =>
      `<div class="p-3 bg-gray-50 rounded-lg border border-gray-200"><div class="flex justify-between items-center"><span class="font-semibold text-indigo-700">${e.code}</span><span class="text-xs px-2 py-1 rounded ${e.riskLevel === 'critical' ? 'bg-red-100 text-red-700' : e.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}">${e.riskLevel === 'critical' ? '极高' : e.riskLevel === 'high' ? '高' : '低'}</span></div><div class="text-sm text-gray-600 mt-1">${e.desc}</div><div class="text-xs text-gray-500 mt-1">控制原因: ${e.controlReason}</div></div>`
    ).join('') + '<div class="text-sm text-gray-500 mt-2">' + result.eccnAnalysis.primaryRecommendation + '</div>';
  } else {
    eccnEl.innerHTML = '<div class="text-sm text-gray-500">' + result.eccnAnalysis.primaryRecommendation + '</div>';
  }
  const detailsEl = document.getElementById('access-details');
  let detailsHTML = '<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">🌍 目标市场: ' + result.targetCountry.name + '</h4>';
  detailsHTML += '<div class="mb-4"><div class="text-sm font-medium text-gray-700 mb-2">强制性认证要求</div><div class="space-y-2">' + result.marketAccess.keyRequirements.map(r => `<div class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span><span class="text-sm text-gray-600">${r}</span></div>`).join('') + '</div></div>';
  detailsHTML += '<div class="mb-4"><div class="text-sm font-medium text-gray-700 mb-2">进口限制</div><div class="space-y-2">' + result.marketAccess.importRestrictions.map(r => `<div class="flex items-start gap-2"><span class="text-red-500 mt-0.5">⚠</span><span class="text-sm text-gray-600">${r}</span></div>`).join('') + '</div></div>';
  detailsHTML += '<div class="p-3 bg-blue-50 rounded-lg text-sm text-blue-800"><span class="font-medium">特别说明:</span> ' + result.marketAccess.specialNotes + '</div>';
  detailsHTML += '<div class="mt-3 text-sm text-gray-500"><span class="font-medium">贸易协定:</span> ' + result.marketAccess.tradeAgreement + '</div></div>';
  detailsHTML += '<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">📋 出口管制评估</h4><div class="p-4 rounded-lg ' + (result.exportControl.level === 'critical' ? 'bg-red-50 border border-red-200' : result.exportControl.level === 'high' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200') + '"><div class="flex items-center gap-2 mb-2"><span class="px-2 py-0.5 rounded text-xs font-semibold ' + (result.exportControl.level === 'critical' ? 'bg-red-200 text-red-800' : result.exportControl.level === 'high' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800') + '">' + result.exportControl.level.toUpperCase() + '</span><span class="font-semibold text-gray-900">' + result.exportControl.reason + '</span></div><div class="text-sm text-gray-600 mb-1"><span class="font-medium">许可证要求:</span> ' + result.exportControl.licenseRequired + '</div><div class="text-sm text-gray-600 mb-1"><span class="font-medium">许可证类型:</span> ' + result.exportControl.licenseType + '</div><div class="text-sm text-gray-600 mb-1"><span class="font-medium">法律依据:</span> ' + result.exportControl.legalBasis + '</div><div class="text-sm text-indigo-700 mt-2 font-medium">' + result.exportControl.recommendation + '</div></div></div>';
  detailsHTML += '<div class="bg-white rounded-xl p-6 border border-gray-200"><h4 class="font-semibold text-gray-900 mb-3">✅ 认证清单</h4><div class="space-y-2">' + result.certificationChecklist.map(c => `<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"><div class="flex-shrink-0"><div class="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center"><span class="text-xs text-gray-400">□</span></div></div><div><div class="text-sm font-medium text-gray-900">${c.item}</div><div class="text-xs text-gray-500">${c.category} | 优先级: ${c.priority} | 预计时间: ${c.estimatedTime}</div></div></div>`).join('') + '</div></div>';
  detailsEl.innerHTML = detailsHTML;
}

// ============================================================
// 5. 合规助手（AI问答）
// ============================================================
const compliancePopularQuestions = [
  "什么是SDN清单？",
  "什么是实体清单（Entity List）？",
  "什么是ECCN出口管制分类？",
  "制裁是否属于不可抗力？",
  "什么是外国直接产品规则（FDPR）？",
  "什么是UFLPA？",
  "什么是CBAM碳边境调节机制？",
  "合同应加入哪些制裁条款？"
];

function renderComplianceAssistant() {
  const container = document.getElementById('tab-compliance');
  if (!container.querySelector('#compliance-chat')) {
    container.innerHTML = `
      <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">合规助手 <span class="text-sm font-normal text-gray-500">—— AI法律问答</span></h2><p class="text-gray-600 mt-1">覆盖制裁合规、出口管制、国际商事合同、强迫劳动、碳边境等5大法律领域</p></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">热门问题</h3>
            <div class="space-y-2" id="compliance-popular">
              ${compliancePopularQuestions.map(q => `<button class="text-sm text-left w-full p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors compliance-question">${q}</button>`).join('')}
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h4 class="font-semibold text-sm text-gray-900 mb-2">知识库覆盖</h4>
            <div class="flex flex-wrap gap-2">
              <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">制裁合规</span>
              <span class="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">出口管制</span>
              <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">国际商事合同</span>
              <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">强迫劳动</span>
              <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">碳边境</span>
            </div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full flex flex-col" id="compliance-chat">
            <div class="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]" id="compliance-messages">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"><span class="text-indigo-600 text-sm font-bold">AI</span></div>
                <div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div class="text-sm text-gray-700">您好！我是LawFlow合规助手，专注于制裁法、出口管制、国际商事合同等领域的法律问题解答。请输入您的问题，或从左侧选择热门问题。</div>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <input type="text" id="compliance-input" class="search-input flex-1" placeholder="输入您的法律问题...">
              <button id="btn-compliance-ask" class="btn-primary">提问</button>
            </div>
          </div>
        </div>
      </div>`;
    
    // 绑定热门问题点击
    container.querySelectorAll('.compliance-question').forEach(btn => {
      btn.addEventListener('click', () => askComplianceQuestion(btn.textContent));
    });
    
    // 绑定输入框回车
    document.getElementById('compliance-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') askComplianceQuestion();
    });
    
    // 绑定提问按钮
    document.getElementById('btn-compliance-ask').addEventListener('click', () => askComplianceQuestion());
  }
}

function askComplianceQuestion(presetQuestion) {
  const input = document.getElementById('compliance-input');
  const question = presetQuestion || input.value.trim();
  if (!question) { alert('请输入问题'); return; }
  
  const messagesEl = document.getElementById('compliance-messages');
  
  // 添加用户消息
  messagesEl.innerHTML += `<div class="flex items-start gap-3 justify-end"><div class="bg-indigo-600 rounded-lg p-3 max-w-[80%]"><div class="text-sm text-white">${question}</div></div><div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span class="text-gray-600 text-sm font-bold">我</span></div></div>`;
  
  if (!presetQuestion) input.value = '';
  messagesEl.scrollTop = messagesEl.scrollHeight;
  
  // 调用AI回答
  setTimeout(() => {
    const answer = window.LawFlowComplianceAssistant.searchAnswer(question);
    let answerHTML = '';
    if (answer.valid) {
      answerHTML = `<div class="text-sm text-gray-700">${answer.answer}</div>`;
      if (answer.legalBasis) {
        answerHTML += `<div class="mt-2 text-xs text-gray-500"><span class="font-medium">法律依据:</span> ${answer.legalBasis}</div>`;
      }
      if (answer.riskLevel) {
        const riskColor = answer.riskLevel === 'critical' ? 'text-red-600' : answer.riskLevel === 'high' ? 'text-orange-600' : 'text-green-600';
        answerHTML += `<div class="mt-1 text-xs ${riskColor}"><span class="font-medium">风险等级:</span> ${answer.riskLevel === 'critical' ? '极高' : answer.riskLevel === 'high' ? '高' : '中'}</div>`;
      }
      if (answer.relatedQuestions && answer.relatedQuestions.length > 0) {
        answerHTML += `<div class="mt-3 pt-3 border-t border-gray-200"><div class="text-xs text-gray-500 mb-2">相关问题:</div><div class="space-y-1">${answer.relatedQuestions.map(q => `<button class="text-xs text-indigo-600 hover:text-indigo-800 text-left compliance-related">${q}</button>`).join('')}</div></div>`;
      }
    } else {
      answerHTML = `<div class="text-sm text-gray-700">${answer.error}</div>`;
    }
    
    messagesEl.innerHTML += `<div class="flex items-start gap-3"><div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"><span class="text-indigo-600 text-sm font-bold">AI</span></div><div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">${answerHTML}</div></div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    // 绑定相关问题点击
    messagesEl.querySelectorAll('.compliance-related').forEach(btn => {
      btn.addEventListener('click', () => askComplianceQuestion(btn.textContent));
    });
  }, 500);
}

// 初始化合规助手（当切换到该Tab时）
document.querySelector('[data-tab="compliance"]').addEventListener('click', () => {
  setTimeout(renderComplianceAssistant, 100);
});

console.log('[LawFlow] UI应用逻辑已加载：制裁扫描 + 法律护盾 + 合同审查 + 准入查询 + 合规助手 + 热点雷达 + 选品选市场');

// ============================================================
// 6. 热点雷达（政策动态预警）
// ============================================================
const POLICY_ALERTS = [
  { date: '2025-06-25', category: '出口管制', title: 'BIS新增11家中国实体至实体清单', source: '联邦公报', riskLevel: 'high', summary: '涉及半导体制造设备和AI芯片设计公司，相关交易需立即停止并进行筛查。', action: '立即筛查交易对手是否在新增清单中' },
  { date: '2025-06-20', category: '制裁', title: 'OFAC更新SDN清单，新增3名个人和7家实体', source: 'OFAC官网', riskLevel: 'critical', summary: '涉及俄罗斯能源领域和伊朗石化行业，二级制裁风险极高。', action: '筛查全部交易对手，暂停涉俄/涉伊交易' },
  { date: '2025-06-15', category: '碳边境', title: 'EU CBAM过渡期申报截止日期提醒', source: '欧盟委员会', riskLevel: 'medium', summary: '2025年Q2碳排放数据申报截止日期为7月31日，逾期可能面临罚款。', action: '准备Q2碳排放数据，通过CBAM系统提交' },
  { date: '2025-06-10', category: '强迫劳动', title: 'UFLPA执法范围扩展至新疆以外地区', source: 'CBP', riskLevel: 'high', summary: 'CBP发布新指南，对来自中国其他地区的特定产品（棉花、番茄、多晶硅）加强审查。', action: '扩大供应链溯源范围，准备全链条证明文件' },
  { date: '2025-06-05', category: '贸易协定', title: 'RCEP原产地规则更新，新增累积规则', source: 'RCEP秘书处', riskLevel: 'low', summary: 'RCEP成员国间原材料累积规则优化，有利于区域供应链整合。', action: '评估利用累积规则优化原产地资格' },
  { date: '2025-06-01', category: '出口管制', title: '日本扩大对华半导体设备出口管制范围', source: '日本经济产业省', riskLevel: 'high', summary: '新增14nm以下DRAM和128层以上NAND闪存制造设备管制，与荷兰、美国协调实施。', action: '审查涉日半导体设备供应链，评估替代方案' },
  { date: '2025-05-28', category: '制裁', title: '欧盟第14轮对俄制裁，新增116个实体', source: '欧盟官方公报', riskLevel: 'critical', summary: '新增实体涉及俄罗斯军工复合体和第三方转运网络，含若干中国实体。', action: '立即筛查交易对手，审查涉俄供应链' },
  { date: '2025-05-20', category: '关税', title: '美国301条款关税复审，部分商品税率调整', source: 'USTR', riskLevel: 'medium', summary: '电动汽车、锂电池、光伏产品关税维持或上调，部分消费品获得豁免。', action: '评估出口产品是否受301关税影响' },
  { date: '2025-05-15', category: '出口管制', title: 'BIS更新实体清单脚注1（华为规则）', source: '联邦公报', riskLevel: 'high', summary: '进一步扩大华为FDPR适用范围，新增先进计算和AI相关技术。', action: '审查含华为及其关联方的任何技术合作' },
  { date: '2025-05-10', category: '碳边境', title: 'CBAM证书价格突破100欧元/吨', source: '欧盟委员会', riskLevel: 'medium', summary: '碳价上涨将直接影响CBAM进口成本，钢铁、水泥行业受影响最大。', action: '重新计算CBAM成本，评估价格竞争力' }
];

function renderHotspotRadar() {
  const container = document.getElementById('tab-radar');
  if (!container.querySelector('#radar-content')) {
    container.innerHTML = `
      <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">热点雷达 <span class="text-sm font-normal text-gray-500">—— 政策动态预警</span></h2><p class="text-gray-600 mt-1">全球制裁、出口管制、碳边境、强迫劳动等法规最新动态与合规预警</p></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">筛选</h3>
            <div class="space-y-3">
              <div><label class="block text-sm font-medium text-gray-700 mb-1">政策类别</label><select id="radar-category" class="search-input"><option value="all">全部类别</option><option value="制裁">制裁</option><option value="出口管制">出口管制</option><option value="碳边境">碳边境</option><option value="强迫劳动">强迫劳动</option><option value="关税">关税</option><option value="贸易协定">贸易协定</option></select></div>
              <div><label class="block text-sm font-medium text-gray-700 mb-1">风险等级</label><select id="radar-risk" class="search-input"><option value="all">全部等级</option><option value="critical">极高风险</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option></select></div>
              <button id="btn-radar-filter" class="btn-primary w-full">筛选</button>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h4 class="font-semibold text-sm text-gray-900 mb-3">统计概览</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm"><span class="text-gray-600">极高风险</span><span class="font-bold text-red-600">${POLICY_ALERTS.filter(a => a.riskLevel === 'critical').length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">高风险</span><span class="font-bold text-orange-600">${POLICY_ALERTS.filter(a => a.riskLevel === 'high').length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">中风险</span><span class="font-bold text-yellow-600">${POLICY_ALERTS.filter(a => a.riskLevel === 'medium').length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">低风险</span><span class="font-bold text-green-600">${POLICY_ALERTS.filter(a => a.riskLevel === 'low').length}</span></div>
            </div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div id="radar-content" class="space-y-4"></div>
        </div>
      </div>`;
    
    document.getElementById('btn-radar-filter').addEventListener('click', () => {
      const category = document.getElementById('radar-category').value;
      const risk = document.getElementById('radar-risk').value;
      displayRadarAlerts(category, risk);
    });
    
    displayRadarAlerts('all', 'all');
  }
}

function displayRadarAlerts(category, risk) {
  const container = document.getElementById('radar-content');
  let alerts = POLICY_ALERTS.slice(); // copy
  if (category !== 'all') alerts = alerts.filter(a => a.category === category);
  if (risk !== 'all') alerts = alerts.filter(a => a.riskLevel === risk);
  
  if (alerts.length === 0) {
    container.innerHTML = '<div class="placeholder-box">暂无符合条件的政策动态</div>';
    return;
  }
  
  container.innerHTML = alerts.map(a => {
    const riskColor = a.riskLevel === 'critical' ? 'red' : a.riskLevel === 'high' ? 'orange' : a.riskLevel === 'medium' ? 'yellow' : 'green';
    const riskLabel = a.riskLevel === 'critical' ? '极高' : a.riskLevel === 'high' ? '高' : a.riskLevel === 'medium' ? '中' : '低';
    return `<div class="bg-white rounded-xl p-6 border border-gray-200">
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-xs font-semibold bg-${riskColor}-100 text-${riskColor}-700">${riskLabel}风险</span>
            <span class="text-xs text-gray-500">${a.category}</span>
            <span class="text-xs text-gray-400">${a.date}</span>
          </div>
          <h4 class="font-semibold text-gray-900">${a.title}</h4>
        </div>
        <span class="text-xs text-gray-400 flex-shrink-0">${a.source}</span>
      </div>
      <div class="text-sm text-gray-600 mb-3">${a.summary}</div>
      <div class="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
        <span class="font-medium">💡 建议行动:</span> ${a.action}
      </div>
    </div>`;
  }).join('');
}

// 初始化热点雷达（当切换到该Tab时）
document.querySelector('[data-tab="radar"]').addEventListener('click', () => {
  setTimeout(renderHotspotRadar, 100);
});

// ============================================================
// 7. 选品选市场（商业决策）
// ============================================================
const PRODUCT_MARKET_MATRIX = {
  'electronics': { name: '电子产品', riskLevel: 'high', markets: { 'US': 'high', 'EU': 'high', 'JP': 'high', 'KR': 'high', 'IN': 'medium', 'BR': 'medium', 'SG': 'low', 'AE': 'low', 'MX': 'medium' }, notes: '半导体、AI芯片、通信设备受出口管制严格限制' },
  'textiles': { name: '纺织品', riskLevel: 'low', markets: { 'US': 'medium', 'EU': 'medium', 'JP': 'low', 'KR': 'low', 'IN': 'low', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'low' }, notes: 'UFLPA合规要求，需准备供应链溯源文件' },
  'machinery': { name: '机械设备', riskLevel: 'medium', markets: { 'US': 'medium', 'EU': 'medium', 'JP': 'medium', 'KR': 'low', 'IN': 'low', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'low' }, notes: '部分高端机床受出口管制，需确认ECCN分类' },
  'chemicals': { name: '化工产品', riskLevel: 'medium', markets: { 'US': 'medium', 'EU': 'high', 'JP': 'low', 'KR': 'low', 'IN': 'medium', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'low' }, notes: 'EU REACH法规+CBAM双重合规要求' },
  'food': { name: '食品农产品', riskLevel: 'low', markets: { 'US': 'medium', 'EU': 'high', 'JP': 'medium', 'KR': 'medium', 'IN': 'low', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'low' }, notes: 'EU EUDR零毁林法案+严格检疫要求' },
  'automotive': { name: '汽车及零部件', riskLevel: 'medium', markets: { 'US': 'high', 'EU': 'high', 'JP': 'medium', 'KR': 'low', 'IN': 'medium', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'medium' }, notes: 'EU/美国对华电动汽车加征高额关税' },
  'renewable': { name: '新能源产品', riskLevel: 'medium', markets: { 'US': 'high', 'EU': 'high', 'JP': 'low', 'KR': 'low', 'IN': 'medium', 'BR': 'low', 'SG': 'low', 'AE': 'high', 'MX': 'low' }, notes: '光伏、风电产品面临欧美贸易壁垒，中东市场增长迅速' },
  'consumer': { name: '日用消费品', riskLevel: 'low', markets: { 'US': 'low', 'EU': 'low', 'JP': 'low', 'KR': 'low', 'IN': 'low', 'BR': 'low', 'SG': 'low', 'AE': 'low', 'MX': 'low' }, notes: '低风险品类，但需关注产品安全和环保标准' }
};

const MARKET_NAMES = { 'US': '美国', 'EU': '欧盟', 'JP': '日本', 'KR': '韩国', 'IN': '印度', 'BR': '巴西', 'SG': '新加坡', 'AE': '阿联酋', 'MX': '墨西哥' };

function renderMarketSelector() {
  const container = document.getElementById('tab-market');
  if (!container.querySelector('#market-content')) {
    container.innerHTML = `
      <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">选品选市场 <span class="text-sm font-normal text-gray-500">—— 基于制裁风险</span></h2><p class="text-gray-600 mt-1">产品类别风险评估 + 目标市场风险矩阵 + 推荐排序</p></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">产品类别</h3>
            <div class="space-y-2" id="market-product-list">
              ${Object.entries(PRODUCT_MARKET_MATRIX).map(([key, p]) => `<button class="market-product-btn w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors" data-product="${key}"><div class="font-medium">${p.name}</div><div class="text-xs text-gray-500">${p.notes.substring(0, 30)}...</div></button>`).join('')}
            </div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div id="market-content" class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div class="placeholder-box">请选择产品类别查看市场推荐</div>
          </div>
        </div>
      </div>`;
    
    container.querySelectorAll('.market-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.market-product-btn').forEach(b => b.classList.remove('bg-indigo-50', 'text-indigo-700'));
        btn.classList.add('bg-indigo-50', 'text-indigo-700');
        displayMarketRecommendation(btn.dataset.product);
      });
    });
  }
}

function displayMarketRecommendation(productKey) {
  const product = PRODUCT_MARKET_MATRIX[productKey];
  if (!product) return;
  
  const container = document.getElementById('market-content');
  const sortedMarkets = Object.entries(product.markets).sort((a, b) => {
    const riskOrder = { 'low': 0, 'medium': 1, 'high': 2 };
    return riskOrder[a[1]] - riskOrder[b[1]];
  });
  
  const riskColor = { 'low': 'green', 'medium': 'yellow', 'high': 'red' };
  const riskLabel = { 'low': '低风险', 'medium': '中风险', 'high': '高风险' };
  
  container.innerHTML = `
    <div class="mb-4">
      <h3 class="text-xl font-bold text-gray-900">${product.name}</h3>
      <div class="flex items-center gap-2 mt-1">
        <span class="px-2 py-0.5 rounded text-xs font-semibold bg-${riskColor[product.riskLevel]}-100 text-${riskColor[product.riskLevel]}-700">${riskLabel[product.riskLevel]}</span>
        <span class="text-sm text-gray-500">${product.notes}</span>
      </div>
    </div>
    <div class="space-y-3">
      ${sortedMarkets.map(([code, risk]) => {
        const color = riskColor[risk];
        const label = riskLabel[risk];
        const name = MARKET_NAMES[code] || code;
        const recommendation = risk === 'low' ? '✅ 推荐优先进入' : risk === 'medium' ? '⚠️ 可以进入，但需合规准备' : '❌ 高风险，建议谨慎或暂缓';
        return `<div class="flex items-center justify-between p-4 rounded-lg border ${risk === 'low' ? 'bg-green-50 border-green-200' : risk === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center text-${color}-700 font-bold text-sm">${code}</div>
            <div>
              <div class="font-semibold text-gray-900">${name}</div>
              <div class="text-xs text-gray-500">${recommendation}</div>
            </div>
          </div>
          <span class="px-2 py-1 rounded text-xs font-semibold bg-${color}-100 text-${color}-700">${label}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <div class="text-sm font-medium text-blue-900 mb-1">💡 综合建议</div>
      <div class="text-sm text-blue-800">${product.riskLevel === 'low' ? '该产品类别制裁风险较低，可优先拓展新兴市场。' : product.riskLevel === 'medium' ? '建议优先进入低风险市场（新加坡、阿联酋等），同时做好高风险市场的合规准备。' : '该产品受出口管制和制裁影响严重，建议寻求法律专业人士协助制定合规方案。'}</div>
    </div>`;
}

// 初始化选品选市场（当切换到该Tab时）
document.querySelector('[data-tab="market"]').addEventListener('click', () => {
  setTimeout(renderMarketSelector, 100);
});
