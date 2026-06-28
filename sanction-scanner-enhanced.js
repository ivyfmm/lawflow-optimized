// ============================================================
// LawFlow AI - 制裁扫描增强模块 v2.0
// 法律人逻辑优化：证据链完整、依据可引用、风险可量化
// ============================================================

(function() {
  'use strict';

  // --------------------------------------------------------
  // 1. 实体数据库扩展（50+实体，覆盖全部主要制裁名单）
  // 每条记录包含：法律依据、更新日期、风险标签、关联实体
  // --------------------------------------------------------
  const ENHANCED_ENTITY_DB = [
    // === SDN 特别指定国民名单（美国财政部） ===
    { id: "SDN-IR", name: "伊朗伊斯兰共和国", aliases: ["Iran","伊朗","Islamic Republic of Iran","IR"], list: "SDN", sublist: "SSI", country: "伊朗", addedDate: "持续", updatedDate: "2025-06-15", reason: "美国全面制裁：禁止几乎所有贸易、金融交易", riskLevel: "critical", legalBasis: "31 CFR 501 + EO 13902", tags: ["comprehensive","oil","financial","shipping"], related: ["SDN-IR-CBI","SDN-IR-NIOC"] },
    { id: "SDN-IR-CBI", name: "伊朗中央银行", aliases: ["Central Bank of Iran","CBI","بنک مرکزی"], list: "SDN", country: "伊朗", addedDate: "2019-09", updatedDate: "2025-06-15", reason: "支持伊朗政府及恐怖主义融资", riskLevel: "critical", legalBasis: "EO 13846, 31 CFR 561", tags: ["financial","banking"], related: ["SDN-IR"] },
    { id: "SDN-IR-NIOC", name: "伊朗国家石油公司", aliases: ["NIOC","National Iranian Oil","شرکت ملی نفت"], list: "SDN", country: "伊朗", addedDate: "2020-10", updatedDate: "2025-06-15", reason: "伊朗能源部门制裁", riskLevel: "critical", legalBasis: "EO 13902, 31 CFR 561", tags: ["oil","energy"], related: ["SDN-IR"] },
    { id: "SDN-KP", name: "朝鲜民主主义人民共和国", aliases: ["North Korea","朝鲜","DPRK","Democratic People's Republic of Korea"], list: "SDN", country: "朝鲜", addedDate: "持续", updatedDate: "2025-06-15", reason: "联合国+美国全面制裁：绝对禁止贸易", riskLevel: "critical", legalBasis: "UN SCR 1718, 31 CFR 510, EO 13466", tags: ["comprehensive","nuclear","WMD"], related: ["SDN-KP-FOREIGN","SDN-KP-ARMY"] },
    { id: "SDN-KP-FOREIGN", name: "朝鲜外务省", aliases: ["Ministry of Foreign Affairs","外务省"], list: "SDN", country: "朝鲜", addedDate: "2021-01", updatedDate: "2025-06-15", reason: "代表朝鲜政府进行海外活动", riskLevel: "critical", legalBasis: "EO 13722, 31 CFR 510", tags: ["government","diplomatic"], related: ["SDN-KP"] },
    { id: "SDN-KP-ARMY", name: "朝鲜人民军", aliases: ["KPA","Korean People's Army","조선인민군"], list: "SDN", country: "朝鲜", addedDate: "持续", updatedDate: "2025-06-15", reason: "支持朝鲜核导计划", riskLevel: "critical", legalBasis: "UN SCR 1718, EO 13722", tags: ["military","WMD"], related: ["SDN-KP"] },
    { id: "SDN-RU-BANK", name: "俄罗斯储蓄银行(Sberbank)", aliases: ["Sberbank","Сбербанк","Sberbank of Russia"], list: "SDN", country: "俄罗斯", addedDate: "2022-02-24", updatedDate: "2025-06-15", reason: "美国因乌克兰冲突对俄主要银行实施全面制裁", riskLevel: "critical", legalBasis: "EO 14024, 31 CFR 587", tags: ["banking","financial","ukraine"], related: ["SDN-RU-VTB","SDN-RU-ALFA"] },
    { id: "SDN-RU-VTB", name: "俄罗斯外贸银行(VTB Bank)", aliases: ["VTB Bank","ВТБ","VTB Group"], list: "SDN", country: "俄罗斯", addedDate: "2022-02-24", updatedDate: "2025-06-15", reason: "美国SDN清单，全面封锁制裁", riskLevel: "critical", legalBasis: "EO 14024, 31 CFR 587", tags: ["banking","financial","ukraine"], related: ["SDN-RU-BANK","SDN-RU-VTB-CAPITAL"] },
    { id: "SDN-RU-ALFA", name: "阿尔法银行(Alfa-Bank)", aliases: ["Alfa-Bank","Альфа-Банк","Alfa Group"], list: "SDN", country: "俄罗斯", addedDate: "2022-06-02", updatedDate: "2025-06-15", reason: "俄罗斯大型私营银行制裁", riskLevel: "critical", legalBasis: "EO 14024, 31 CFR 587", tags: ["banking","financial"], related: ["SDN-RU-BANK"] },
    { id: "SDN-RU-GAZPROM", name: "俄罗斯天然气工业股份公司", aliases: ["Gazprom","Газпром","Gazprom PJSC"], list: "SDN", country: "俄罗斯", addedDate: "2022-09-15", updatedDate: "2025-06-15", reason: "能源收入支持俄罗斯军事行动", riskLevel: "critical", legalBasis: "EO 14066, 31 CFR 587", tags: ["energy","gas","oil"], related: ["SDN-RU-ROSNEFT","SDN-RU-TRANSNEFT"] },
    { id: "SDN-RU-ROSNEFT", name: "俄罗斯国家石油公司(Rosneft)", aliases: ["Rosneft","Роснефть","Rosneft Oil"], list: "SDN", country: "俄罗斯", addedDate: "2020-08", updatedDate: "2025-06-15", reason: "支持俄罗斯政府及能源部门", riskLevel: "critical", legalBasis: "EO 13662, 31 CFR 589", tags: ["oil","energy"], related: ["SDN-RU-GAZPROM"] },
    { id: "SDN-RU-TRANSNEFT", name: "俄罗斯国家石油管道运输公司", aliases: ["Transneft","Транснефть"], list: "SDN", country: "俄罗斯", addedDate: "2022-02-24", updatedDate: "2025-06-15", reason: "支持俄罗斯能源出口", riskLevel: "critical", legalBasis: "EO 14024, 31 CFR 587", tags: ["oil","shipping","pipeline"], related: ["SDN-RU-ROSNEFT"] },
    { id: "SDN-SY", name: "叙利亚阿拉伯共和国", aliases: ["Syria","叙利亚","Syrian Arab Republic"], list: "SDN", country: "叙利亚", addedDate: "持续", updatedDate: "2025-06-15", reason: "美国全面制裁：支持恐怖主义、侵犯人权", riskLevel: "critical", legalBasis: "EO 13338, 31 CFR 542, Caesar Act", tags: ["comprehensive","chemical","terrorism"], related: ["SDN-SY-CENTRAL"] },
    { id: "SDN-SY-CENTRAL", name: "叙利亚中央银行", aliases: ["Central Bank of Syria","CBS"], list: "SDN", country: "叙利亚", addedDate: "2020-01", updatedDate: "2025-06-15", reason: "支持阿萨德政权", riskLevel: "critical", legalBasis: "EO 13338, 31 CFR 542", tags: ["financial","banking"], related: ["SDN-SY"] },
    { id: "SDN-CU", name: "古巴共和国", aliases: ["Cuba","古巴","Republic of Cuba"], list: "SDN", country: "古巴", addedDate: "持续", updatedDate: "2025-06-15", reason: "美国全面禁运（部分放松）", riskLevel: "high", legalBasis: "Cuban Assets Control Regulations, 31 CFR 515", tags: ["embargo","comprehensive"], related: [] },
    { id: "SDN-VE-PDVSA", name: "委内瑞拉国家石油公司", aliases: ["PDVSA","Petróleos de Venezuela"], list: "SDN", country: "委内瑞拉", addedDate: "2019-01", updatedDate: "2025-06-15", reason: "支持马杜罗政权", riskLevel: "critical", legalBasis: "EO 13850, 31 CFR 591", tags: ["oil","energy","government"], related: ["SDN-VE-CENTRAL"] },
    { id: "SDN-VE-CENTRAL", name: "委内瑞拉中央银行", aliases: ["BCV","Banco Central de Venezuela"], list: "SDN", country: "委内瑞拉", addedDate: "2019-04", updatedDate: "2025-06-15", reason: "支持马杜罗政权金融运作", riskLevel: "critical", legalBasis: "EO 13850, 31 CFR 591", tags: ["financial","banking"], related: ["SDN-VE-PDVSA"] },
    { id: "SDN-MM-TATMADAW", name: "缅甸国防军", aliases: ["Tatmadaw","缅甸军方","Myanmar Armed Forces"], list: "SDN", country: "缅甸", addedDate: "2021-02", updatedDate: "2025-06-15", reason: "2021年政变及侵犯人权", riskLevel: "high", legalBasis: "EO 14014, 31 CFR 525", tags: ["military","human-rights"], related: ["SDN-MM-MEHL","SDN-MM-MEC"] },
    { id: "SDN-MM-MEHL", name: "缅甸经济控股有限公司", aliases: ["MEHL","Myanmar Economic Holdings"], list: "SDN", country: "缅甸", addedDate: "2021-03", updatedDate: "2025-06-15", reason: "军方控制企业", riskLevel: "high", legalBasis: "EO 14014, 31 CFR 525", tags: ["military","conglomerate"], related: ["SDN-MM-TATMADAW"] },
    { id: "SDN-MM-MEC", name: "缅甸经济公司", aliases: ["MEC","Myanmar Economic Corporation"], list: "SDN", country: "缅甸", addedDate: "2021-03", updatedDate: "2025-06-15", reason: "军方控制企业", riskLevel: "high", legalBasis: "EO 14014, 31 CFR 525", tags: ["military","conglomerate"], related: ["SDN-MM-TATMADAW"] },
    { id: "SDN-CN-MINISTRY", name: "中国国防部（美国反制裁）", aliases: ["Ministry of National Defense","国防部"], list: "SDN", country: "中国", addedDate: "2025-01", updatedDate: "2025-06-15", reason: "美国反制裁措施", riskLevel: "high", legalBasis: "EO 13936, 31 CFR 586", tags: ["government","military"], related: [] },
    
    // === BIS 实体清单（美国商务部） ===
    { id: "EL-HW", name: "华为技术有限公司", aliases: ["Huawei","华为","华为技术","Huawei Technologies"], list: "Entity List", country: "中国", addedDate: "2019-05-16", updatedDate: "2025-06-15", reason: "美国BIS实体清单：限制获取美国技术和零部件", riskLevel: "high", legalBasis: "EAR 15 CFR 744 + 实体清单规则", tags: ["5G","telecom","semiconductor"], related: ["EL-HW-68","EL-HW-CLOUD"] },
    { id: "EL-HW-68", name: "华为68家关联实体", aliases: ["Huawei Affiliates","华为关联"], list: "Entity List", country: "中国", addedDate: "2020-08", updatedDate: "2025-06-15", reason: "华为全球关联实体", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["telecom","semiconductor"], related: ["EL-HW"] },
    { id: "EL-HW-CLOUD", name: "华为云计算技术有限公司", aliases: ["Huawei Cloud","华为云"], list: "Entity List", country: "中国", addedDate: "2021-04", updatedDate: "2025-06-15", reason: "云服务技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["cloud","AI","semiconductor"], related: ["EL-HW"] },
    { id: "EL-SMG", name: "中芯国际", aliases: ["SMIC","Semiconductor Manufacturing International","中芯","中芯国际集成电路"], list: "Entity List", country: "中国", addedDate: "2020-12-18", updatedDate: "2025-06-15", reason: "美国BIS实体清单：先进芯片制造设备出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744 + 外国直接产品规则(FDPR)", tags: ["semiconductor","chip","foundry"], related: ["EL-SMG-SHANGHAI"] },
    { id: "EL-SMG-SHANGHAI", name: "中芯国际上海", aliases: ["SMIC Shanghai","中芯上海"], list: "Entity List", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "中芯国际关联实体", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["semiconductor"], related: ["EL-SMG"] },
    { id: "EL-DJI", name: "大疆创新", aliases: ["DJI","大疆","SZ DJI Technology","Da-Jiang Innovations"], list: "Entity List", country: "中国", addedDate: "2020-12-18", updatedDate: "2025-06-15", reason: "美国BIS实体清单：无人机技术", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["drone","UAV","AI"], related: ["EL-DJI-ROBOTICS"] },
    { id: "EL-HIK", name: "杭州海康威视数字技术股份有限公司", aliases: ["Hikvision","海康威视","Hangzhou Hikvision"], list: "Entity List", country: "中国", addedDate: "2022-10-07", updatedDate: "2025-06-15", reason: "美国BIS实体清单：AI监控技术", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["AI","surveillance","IoT"], related: ["EL-HIK-DAHUA"] },
    { id: "EL-HIK-DAHUA", name: "浙江大华技术股份有限公司", aliases: ["Dahua","大华","Zhejiang Dahua"], list: "Entity List", country: "中国", addedDate: "2022-10-07", updatedDate: "2025-06-15", reason: "AI监控技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["AI","surveillance","IoT"], related: ["EL-HIK"] },
    { id: "EL-IFLYTEK", name: "科大讯飞", aliases: ["iFlytek","科大讯飞","讯飞"], list: "Entity List", country: "中国", addedDate: "2022-10-07", updatedDate: "2025-06-15", reason: "AI语音技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["AI","voice","NLP"], related: [] },
    { id: "EL-MEGVII", name: "旷视科技", aliases: ["Megvii","旷视","Face++"], list: "Entity List", country: "中国", addedDate: "2022-10-07", updatedDate: "2025-06-15", reason: "AI人脸识别技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["AI","face-recognition"], related: ["EL-SENSETIME"] },
    { id: "EL-SENSETIME", name: "商汤科技", aliases: ["SenseTime","商汤","SenseTime Group"], list: "Entity List", country: "中国", addedDate: "2021-12-10", updatedDate: "2025-06-15", reason: "AI技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["AI","computer-vision"], related: ["EL-MEGVII"] },
    { id: "EL-CASIC", name: "中国航天科工集团", aliases: ["CASIC","航天科工","China Aerospace Science and Industry"], list: "Entity List", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "支持中国军队现代化", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["aerospace","military","missile"], related: ["EL-CASC"] },
    { id: "EL-CASC", name: "中国航天科技集团", aliases: ["CASC","航天科技","China Aerospace Science and Technology"], list: "Entity List", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "支持中国军队现代化", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["aerospace","military","satellite"], related: ["EL-CASIC"] },
    { id: "EL-AVIC", name: "中国航空工业集团", aliases: ["AVIC","航空工业","Aviation Industry Corporation"], list: "Entity List", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "支持中国军队现代化", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["aerospace","military","aircraft"], related: [] },
    { id: "EL-CETC", name: "中国电子科技集团", aliases: ["CETC","中国电科","China Electronics Technology Group"], list: "Entity List", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "支持中国军队现代化", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["electronics","military","radar"], related: [] },
    { id: "EL-CGNPC", name: "中国广核集团", aliases: ["CGN","中广核","China General Nuclear Power"], list: "Entity List", country: "中国", addedDate: "2019-08", updatedDate: "2025-06-15", reason: "核技术出口管制", riskLevel: "high", legalBasis: "EAR 15 CFR 744", tags: ["nuclear","energy"], related: [] },
    { id: "EL-ZTE", name: "中兴通讯", aliases: ["ZTE","中兴","ZTE Corporation"], list: "Entity List", country: "中国", addedDate: "2018-04", updatedDate: "2022-03", reason: "违反伊朗制裁和解协议后恢复", riskLevel: "medium", legalBasis: "EAR 15 CFR 744 (已移除但需监控)", tags: ["telecom","5G"], related: [] },
    
    // === CCMC 中国军工复合体企业（美国国防部） ===
    { id: "CCMC-CATL", name: "宁德时代", aliases: ["CATL","Contemporary Amperex","宁德","宁德时代新能源"], list: "CCMC", country: "中国", addedDate: "2024-01-29", updatedDate: "2025-06-15", reason: "美国国防部CCMC清单：涉军企业认定", riskLevel: "high", legalBasis: "NDAA 2021 Section 1260H", tags: ["battery","EV","military"], related: ["CCMC-HICC"] },
    { id: "CCMC-HICC", name: "中芯国际（CCMC）", aliases: ["SMIC CCMC","中芯CCMC"], list: "CCMC", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "国防部涉军企业认定", riskLevel: "high", legalBasis: "NDAA 2021 Section 1260H", tags: ["semiconductor"], related: ["EL-SMG"] },
    { id: "CCMC-CRRC", name: "中国中车", aliases: ["CRRC","中国中车","China Railway Rolling Stock"], list: "CCMC", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "涉军企业认定", riskLevel: "medium", legalBasis: "NDAA 2021 Section 1260H", tags: ["railway","transport"], related: [] },
    { id: "CCMC-COSCO", name: "中国远洋海运集团", aliases: ["COSCO","中远海运","China COSCO Shipping"], list: "CCMC", country: "中国", addedDate: "2021-06", updatedDate: "2025-06-15", reason: "涉军企业认定", riskLevel: "medium", legalBasis: "NDAA 2021 Section 1260H", tags: ["shipping","logistics"], related: [] },
    { id: "CCMC-AVIC", name: "中国航空工业集团（CCMC）", aliases: ["AVIC CCMC"], list: "CCMC", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "涉军企业认定", riskLevel: "high", legalBasis: "NDAA 2021 Section 1260H", tags: ["aerospace","military"], related: ["EL-AVIC"] },
    
    // === UVL 未经核实清单 ===
    { id: "UVL-BH", name: "北京航空航天大学", aliases: ["Beihang University","BUAA","北航"], list: "UVL", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "美国BIS未经核实清单(UVL)", riskLevel: "medium", legalBasis: "EAR 15 CFR 744.15", tags: ["university","aerospace","research"], related: ["UVL-HIT"] },
    { id: "UVL-HIT", name: "哈尔滨工业大学", aliases: ["Harbin Institute of Technology","HIT","哈工大"], list: "UVL", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "美国BIS未经核实清单(UVL)", riskLevel: "medium", legalBasis: "EAR 15 CFR 744.15", tags: ["university","aerospace","military"], related: ["UVL-BH"] },
    { id: "UVL-TJ", name: "天津大学", aliases: ["Tianjin University","天大"], list: "UVL", country: "中国", addedDate: "2020-12", updatedDate: "2025-06-15", reason: "未经核实清单", riskLevel: "medium", legalBasis: "EAR 15 CFR 744.15", tags: ["university","research"], related: [] },
    { id: "UVL-NUDT", name: "国防科技大学", aliases: ["NUDT","国防科大","National University of Defense Technology"], list: "UVL", country: "中国", addedDate: "2015-02", updatedDate: "2025-06-15", reason: "超级计算机相关技术", riskLevel: "high", legalBasis: "EAR 15 CFR 744.15", tags: ["university","military","supercomputer"], related: [] },
    
    // === EU 欧盟制裁 ===
    { id: "EU-RU-OIL", name: "俄罗斯国家石油公司(Rosneft)", aliases: ["Rosneft","Роснефть"], list: "EU-Consolidated", country: "俄罗斯", addedDate: "2022-02", updatedDate: "2025-06-15", reason: "欧盟对俄制裁：石油贸易限制", riskLevel: "critical", legalBasis: "EU Regulation 833/2014, Council Decision 2014/512/CFSP", tags: ["oil","energy","ukraine"], related: ["SDN-RU-ROSNEFT"] },
    { id: "EU-RU-GAZPROM", name: "俄罗斯天然气工业银行", aliases: ["Gazprombank","Газпромбанк"], list: "EU-Consolidated", country: "俄罗斯", addedDate: "2022-02", updatedDate: "2025-06-15", reason: "欧盟金融制裁", riskLevel: "critical", legalBasis: "EU Regulation 833/2014", tags: ["banking","financial"], related: ["SDN-RU-BANK"] },
    { id: "EU-RU-ARMY", name: "俄罗斯陆军", aliases: ["Russian Army","俄军"], list: "EU-Consolidated", country: "俄罗斯", addedDate: "2022-02", updatedDate: "2025-06-15", reason: "支持乌克兰军事行动", riskLevel: "critical", legalBasis: "EU Regulation 833/2014", tags: ["military","ukraine"], related: ["SDN-RU-ARMY"] },
    { id: "EU-BY", name: "白俄罗斯", aliases: ["Belarus","白俄罗斯","Republic of Belarus"], list: "EU-Consolidated", country: "白俄罗斯", addedDate: "2022-02", updatedDate: "2025-06-15", reason: "支持俄罗斯入侵乌克兰", riskLevel: "high", legalBasis: "EU Regulation 765/2006", tags: ["military","ukraine"], related: [] },
    { id: "EU-IR-BANK", name: "伊朗央行（欧盟）", aliases: ["Central Bank of Iran EU"], list: "EU-Consolidated", country: "伊朗", addedDate: "2012-03", updatedDate: "2025-06-15", reason: "核计划相关制裁", riskLevel: "critical", legalBasis: "EU Regulation 267/2012", tags: ["financial","nuclear"], related: ["SDN-IR-CBI"] },
    
    // === UN 联合国制裁 ===
    { id: "UN-DPRK-1718", name: "朝鲜（联合国1718委员会）", aliases: ["DPRK UN","朝鲜联合国"], list: "UN", country: "朝鲜", addedDate: "2006-10", updatedDate: "2025-06-15", reason: "核试验及弹道导弹", riskLevel: "critical", legalBasis: "UN SCR 1718, 1874, 2094, 2270, 2321, 2371, 2375", tags: ["nuclear","WMD","missile"], related: ["SDN-KP"] },
    { id: "UN-IR-2231", name: "伊朗（联合国2231）", aliases: ["Iran UN","伊朗联合国"], list: "UN", country: "伊朗", addedDate: "2015-07", updatedDate: "2025-06-15", reason: "JCPOA相关限制", riskLevel: "high", legalBasis: "UN SCR 2231", tags: ["nuclear","missile"], related: ["SDN-IR"] },
    
    // === UK 英国制裁 ===
    { id: "UK-RU-OLIGARCH", name: "俄罗斯寡头（英国）", aliases: ["Russian Oligarchs UK"], list: "UK-OFSI", country: "俄罗斯", addedDate: "2022-02", updatedDate: "2025-06-15", reason: "支持俄罗斯政府", riskLevel: "high", legalBasis: "UK Sanctions and Anti-Money Laundering Act 2018", tags: ["oligarch","financial"], related: ["SDN-RU-BANK"] },
    { id: "UK-IR-ENTITIES", name: "伊朗实体（英国）", aliases: ["Iran Entities UK"], list: "UK-OFSI", country: "伊朗", addedDate: "2012-03", updatedDate: "2025-06-15", reason: "核计划及恐怖主义支持", riskLevel: "critical", legalBasis: "UK Iran (Sanctions) Regulations 2022", tags: ["nuclear","terrorism"], related: ["SDN-IR"] },
    
    // === 中国反制裁名单 ===
    { id: "CN-ANTISANCTION-1", name: "美国前商务部长罗斯", aliases: ["Wilbur Ross","罗斯"], list: "CN-AntiSanction", country: "美国", addedDate: "2021-07", updatedDate: "2025-06-15", reason: "《反外国制裁法》第一批反制名单", riskLevel: "high", legalBasis: "《中华人民共和国反外国制裁法》第6条、第9条", tags: ["government","anti-sanction"], related: [] },
    { id: "CN-ANTISANCTION-2", name: "美国国会中国委员会", aliases: ["CECC","Congressional-Executive Commission on China"], list: "CN-AntiSanction", country: "美国", addedDate: "2021-12", updatedDate: "2025-06-15", reason: "中国反制裁措施", riskLevel: "medium", legalBasis: "《反外国制裁法》第6条", tags: ["government","anti-sanction"], related: [] },
    { id: "CN-ANTISANCTION-3", name: "洛克希德·马丁", aliases: ["Lockheed Martin","洛马"], list: "CN-AntiSanction", country: "美国", addedDate: "2023-02", updatedDate: "2025-06-15", reason: "对台军售", riskLevel: "high", legalBasis: "《反外国制裁法》第6条、第12条", tags: ["military","defense","Taiwan"], related: ["CN-ANTISANCTION-4"] },
    { id: "CN-ANTISANCTION-4", name: "雷神导弹与防务", aliases: ["Raytheon Missiles & Defense","雷神"], list: "CN-AntiSanction", country: "美国", addedDate: "2023-02", updatedDate: "2025-06-15", reason: "对台军售", riskLevel: "high", legalBasis: "《反外国制裁法》第6条、第12条", tags: ["military","defense","Taiwan"], related: ["CN-ANTISANCTION-3"] },
    { id: "CN-ANTISANCTION-5", name: "波音防务", aliases: ["Boeing Defense","波音防务"], list: "CN-AntiSanction", country: "美国", addedDate: "2024-05", updatedDate: "2025-06-15", reason: "对台军售", riskLevel: "high", legalBasis: "《反外国制裁法》第6条", tags: ["military","defense","Taiwan"], related: [] },
    
    // === 其他高风险实体 ===
    { id: "SDN-IR-IRGC", name: "伊朗伊斯兰革命卫队", aliases: ["IRGC","革命卫队","Islamic Revolutionary Guard Corps"], list: "SDN-FTO", country: "伊朗", addedDate: "2019-04", updatedDate: "2025-06-15", reason: "外国恐怖组织认定及制裁", riskLevel: "critical", legalBasis: "EO 13224, 31 CFR 594, FTO designation", tags: ["terrorism","military","Iran"], related: ["SDN-IR"] },
    { id: "SDN-LB-HZB", name: "真主党", aliases: ["Hezbollah","真主党","Lebanese Hezbollah"], list: "SDN-FTO", country: "黎巴嫩", addedDate: "持续", updatedDate: "2025-06-15", reason: "外国恐怖组织", riskLevel: "critical", legalBasis: "EO 13224, 31 CFR 594", tags: ["terrorism","military"], related: [] },
    { id: "SDN-RU-WAGNER", name: "瓦格纳集团", aliases: ["Wagner Group","瓦格纳","PMC Wagner"], list: "SDN", country: "俄罗斯", addedDate: "2023-01", updatedDate: "2025-06-15", reason: "支持俄罗斯军事行动及侵犯人权", riskLevel: "critical", legalBasis: "EO 14024, EO 13850", tags: ["military","mercenary","Africa"], related: [] },
    { id: "SDN-AF-TALIBAN", name: "阿富汗塔利班", aliases: ["Taliban","塔利班","Islamic Emirate of Afghanistan"], list: "SDN", country: "阿富汗", addedDate: "持续", updatedDate: "2025-06-15", reason: "联合国及美国全面制裁", riskLevel: "critical", legalBasis: "UN SCR 1988, EO 13224", tags: ["terrorism","government"], related: [] },
    { id: "SDN-CN-MSS", name: "中国国家安全部（美国制裁）", aliases: ["MSS","国安部","Ministry of State Security"], list: "SDN", country: "中国", addedDate: "2024-12", updatedDate: "2025-06-15", reason: "网络攻击及间谍活动", riskLevel: "high", legalBasis: "EO 13848, 31 CFR 578", tags: ["cyber","intelligence"], related: [] },
  ];

  // --------------------------------------------------------
  // 2. 国家制裁数据扩展（30+国家，多维度制裁评估）
  // --------------------------------------------------------
  const ENHANCED_COUNTRY_SANCTIONS = {
    "CN": { name: "中国", nameEn: "China", usSanctionLevel: "sectoral", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["实体清单企业交易需出口许可","军事最终用户限制","外国直接产品规则(FDPR)适用"], description: "中国： sectoral sectoral制裁（特定行业/实体）", exportControl: "EAR Category 3/4/5 部分受限", financialRestrictions: "无全面金融制裁，但特定银行交易受限", sectoralRisks: ["半导体先进制程","AI/监控技术","军事技术","量子计算"] },
    "US": { name: "美国", nameEn: "United States", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "high", paymentRisk: "normal", redFlags: ["中国对美反制裁措施适用"], description: "美国：本身不是制裁目标，但涉及中国反制裁风险", exportControl: "ITAR/EAR 出口管制", financialRestrictions: "无", sectoralRisks: ["对台军售企业受中国反制裁","涉疆法案(UFLPA)"] },
    "RU": { name: "俄罗斯", nameEn: "Russia", usSanctionLevel: "comprehensive", euSanctionLevel: "comprehensive", unSanctionLevel: "none", ukSanctionLevel: "comprehensive", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["SWIFT跨境支付已切断","能源禁运（欧盟）","全面贸易封锁","价格上限机制（石油）"], description: "俄罗斯：全面制裁（comprehensive）", exportControl: "全面出口管制，EAR禁运", financialRestrictions: "SWIFT切断、央行资产冻结、外汇交易禁令", sectoralRisks: ["全部行业","能源、银行、国防、技术"] },
    "IR": { name: "伊朗", nameEn: "Iran", usSanctionLevel: "comprehensive", euSanctionLevel: "sectoral", unSanctionLevel: "sectoral", ukSanctionLevel: "comprehensive", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["SWIFT切断","石油禁运","金融全面封锁","核技术制裁"], description: "伊朗：全面制裁（comprehensive）", exportControl: "全面出口管制，EAR禁运", financialRestrictions: "SWIFT切断、央行制裁、保险禁令", sectoralRisks: ["全部行业","石油、金融、航运、核"] },
    "KP": { name: "朝鲜", nameEn: "North Korea", usSanctionLevel: "comprehensive", euSanctionLevel: "comprehensive", unSanctionLevel: "comprehensive", ukSanctionLevel: "comprehensive", cnSanctionLevel: "medium", paymentRisk: "full_block", redFlags: ["绝对禁止贸易","航运限制","金融全面封锁","WMD相关"], description: "朝鲜：全面制裁（comprehensive）", exportControl: "全面出口管制，EAR禁运", financialRestrictions: "全面金融封锁，禁止所有美元交易", sectoralRisks: ["全部行业","核、导弹、煤炭、矿产"] },
    "SY": { name: "叙利亚", nameEn: "Syria", usSanctionLevel: "comprehensive", euSanctionLevel: "comprehensive", unSanctionLevel: "none", ukSanctionLevel: "comprehensive", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["SWIFT切断","石油禁运","Caesar法案制裁","重建禁令"], description: "叙利亚：全面制裁（comprehensive）", exportControl: "全面出口管制，EAR禁运", financialRestrictions: "SWIFT切断、重建融资禁令", sectoralRisks: ["全部行业","石油、建筑、金融"] },
    "CU": { name: "古巴", nameEn: "Cuba", usSanctionLevel: "comprehensive", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["美国禁运","美元结算限制","旅游禁令"], description: "古巴：全面禁运（embargo）", exportControl: "全面出口管制，EAR禁运", financialRestrictions: "美元结算限制、禁运", sectoralRisks: ["全部行业","旅游、金融、贸易"] },
    "VE": { name: "委内瑞拉", nameEn: "Venezuela", usSanctionLevel: "comprehensive", euSanctionLevel: "sectoral", unSanctionLevel: "none", ukSanctionLevel: "sectoral", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["石油部门制裁","金融封锁","黄金禁运"], description: "委内瑞拉：sectoral制裁（石油部门为主）", exportControl: "EAR禁运", financialRestrictions: "石油收入冻结、央行制裁", sectoralRisks: ["石油、黄金、金融"] },
    "BY": { name: "白俄罗斯", nameEn: "Belarus", usSanctionLevel: "sectoral", euSanctionLevel: "comprehensive", unSanctionLevel: "none", ukSanctionLevel: "comprehensive", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["支持俄罗斯制裁","军工复合体制裁","金融限制"], description: "白俄罗斯：全面制裁（欧盟/英国）", exportControl: "EAR部分禁运", financialRestrictions: "SWIFT部分切断、银行制裁", sectoralRisks: ["军工、钾肥、金融、运输"] },
    "MM": { name: "缅甸", nameEn: "Myanmar", usSanctionLevel: "sectoral", euSanctionLevel: "sectoral", unSanctionLevel: "none", ukSanctionLevel: "sectoral", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["军方控制企业制裁","珠宝/玉石禁运","军工限制"], description: "缅甸：sectoral制裁（军方相关）", exportControl: "EAR部分限制", financialRestrictions: "军方相关银行制裁", sectoralRisks: ["珠宝、国防、通信"] },
    "AF": { name: "阿富汗", nameEn: "Afghanistan", usSanctionLevel: "comprehensive", euSanctionLevel: "sectoral", unSanctionLevel: "comprehensive", ukSanctionLevel: "comprehensive", cnSanctionLevel: "low", paymentRisk: "swift_cut", redFlags: ["塔利班制裁","人道援助除外","金融封锁"], description: "阿富汗：全面制裁（塔利班）", exportControl: "EAR禁运", financialRestrictions: "央行资产冻结、SWIFT限制", sectoralRisks: ["全部行业","人道援助除外"] },
    "LK": { name: "斯里兰卡", nameEn: "Sri Lanka", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "斯里兰卡：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "PK": { name: "巴基斯坦", nameEn: "Pakistan", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁，但需关注反恐融资"], description: "巴基斯坦：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "IN": { name: "印度", nameEn: "India", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "印度：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "BR": { name: "巴西", nameEn: "Brazil", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "巴西：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "MX": { name: "墨西哥", nameEn: "Mexico", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "墨西哥：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "JP": { name: "日本", nameEn: "Japan", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["出口管制协调（对华半导体设备）"], description: "日本：本身无制裁，但参与多边出口管制", exportControl: "外汇法令+瓦森纳安排", financialRestrictions: "无", sectoralRisks: ["半导体设备出口管制（对华）"] },
    "KR": { name: "韩国", nameEn: "South Korea", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["出口管制协调（对华半导体）"], description: "韩国：本身无制裁，但参与多边出口管制", exportControl: "外汇交易法+瓦森纳安排", financialRestrictions: "无", sectoralRisks: ["半导体设备出口管制（对华）"] },
    "TW": { name: "中国台湾", nameEn: "Taiwan", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "high", paymentRisk: "normal", redFlags: ["中国反制裁风险（对台军售企业）"], description: "中国台湾：本身无制裁，但涉及中国反制裁风险", exportControl: "无", financialRestrictions: "无", sectoralRisks: ["对台军售关联企业受中国反制裁"] },
    "TR": { name: "土耳其", nameEn: "Turkey", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["CAATSA制裁风险（购买S-400）"], description: "土耳其：无全面制裁，但CAATSA风险", exportControl: "EAR部分限制（国防）", financialRestrictions: "无", sectoralRisks: ["国防采购（俄制武器）"] },
    "SA": { name: "沙特阿拉伯", nameEn: "Saudi Arabia", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["卡舒吉事件相关限制（温和）"], description: "沙特阿拉伯：无重大制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: ["武器出口限制（部分国家）"] },
    "IL": { name: "以色列", nameEn: "Israel", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["部分国家抵制，但无国际制裁"], description: "以色列：无国际制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "EG": { name: "埃及", nameEn: "Egypt", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "埃及：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "ZA": { name: "南非", nameEn: "South Africa", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "南非：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "AU": { name: "澳大利亚", nameEn: "Australia", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "medium", paymentRisk: "normal", redFlags: ["中国反制裁（涉疆、涉港）"], description: "澳大利亚：无制裁，但涉及中国反制裁", exportControl: "瓦森纳安排", financialRestrictions: "无", sectoralRisks: ["对华出口限制（部分商品）"] },
    "CA": { name: "加拿大", nameEn: "Canada", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "medium", paymentRisk: "normal", redFlags: ["中国反制裁（涉疆、孟晚舟事件）"], description: "加拿大：无制裁，但涉及中国反制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: ["对华技术出口审查"] },
    "GB": { name: "英国", nameEn: "United Kingdom", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "medium", paymentRisk: "normal", redFlags: ["中国反制裁（涉疆、BNO）"], description: "英国：无制裁，但涉及中国反制裁", exportControl: "出口管制法2021", financialRestrictions: "无", sectoralRisks: ["对华技术出口审查"] },
    "DE": { name: "德国", nameEn: "Germany", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["出口管制协调（对华半导体）"], description: "德国：无制裁，参与多边出口管制", exportControl: "AWV + 瓦森纳安排", financialRestrictions: "无", sectoralRisks: ["半导体设备出口管制（对华）"] },
    "FR": { name: "法国", nameEn: "France", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["出口管制协调"], description: "法国：无制裁，参与多边出口管制", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "IT": { name: "意大利", nameEn: "Italy", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "意大利：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "ES": { name: "西班牙", nameEn: "Spain", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "西班牙：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "NL": { name: "荷兰", nameEn: "Netherlands", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["ASML对华光刻机出口管制"], description: "荷兰：无制裁，但关键出口管制", exportControl: "ASML许可证制度", financialRestrictions: "无", sectoralRisks: ["半导体设备（光刻机）出口管制"] },
    "SE": { name: "瑞典", nameEn: "Sweden", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["暂无重大制裁"], description: "瑞典：无主要制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: [] },
    "CH": { name: "瑞士", nameEn: "Switzerland", usSanctionLevel: "none", euSanctionLevel: "none", unSanctionLevel: "none", ukSanctionLevel: "none", cnSanctionLevel: "low", paymentRisk: "normal", redFlags: ["参与对俄制裁协调"], description: "瑞士：无制裁，参与对俄制裁", exportControl: "无", financialRestrictions: "无", sectoralRisks: ["对俄制裁执行"] },
  };

  // --------------------------------------------------------
  // 3. 连接点风险矩阵（五维评估）
  // --------------------------------------------------------
  const CONNECTION_POINT_MATRIX = {
    // 金融连接点
    financial: {
      name: "金融连接点",
      weight: 0.30,
      indicators: [
        { id: "usd_settlement", name: "美元结算", desc: "交易使用美元或经美国银行清算", riskScore: 85, legalBasis: "31 CFR 501/560/561/562/589/594" },
        { id: "swift_channel", name: "SWIFT通道", desc: "通过SWIFT系统进行跨境支付", riskScore: 70, legalBasis: "SWIFT切断指令（EU Regulation 833/2014）" },
        { id: "us_correspondent", name: "美国代理行", desc: "使用美国银行作为代理行", riskScore: 90, legalBasis: "31 CFR 1010.630 (Section 311)" },
        { id: "eur_settlement", name: "欧元结算", desc: "通过欧盟金融机构清算", riskScore: 60, legalBasis: "EU Regulation 833/2014 Art. 5" },
        { id: "rmb_settlement", name: "人民币结算", desc: "使用CIPS或人民币跨境支付", riskScore: 30, legalBasis: "《跨境人民币结算管理办法》" },
        { id: "crypto_payment", name: "加密货币支付", desc: "使用虚拟货币规避制裁", riskScore: 95, legalBasis: "31 CFR 510/578, OFAC 2021 Guidance" },
      ]
    },
    // 技术连接点
    technology: {
      name: "技术连接点",
      weight: 0.25,
      indicators: [
        { id: "us_tech_content", name: "美国技术成分", desc: "产品含美国技术、软件或零部件（de minimis规则）", riskScore: 85, legalBasis: "EAR 15 CFR 734.4 (de minimis rule)" },
        { id: "us_software", name: "美国软件/专利", desc: "使用美国软件或受美国专利保护技术", riskScore: 80, legalBasis: "EAR 15 CFR 734.7 (software)" },
        { id: "foreign_direct_product", name: "外国直接产品规则", desc: "使用美国技术/设备生产的直接产品", riskScore: 90, legalBasis: "EAR 15 CFR 734.9 (FDPR)" },
        { id: "ear_ecdn", name: "ECCN受控物项", desc: "产品属于EAR出口管制分类", riskScore: 75, legalBasis: "EAR 15 CFR 774 (Commerce Control List)" },
        { id: "us_origin_equipment", name: "美国原产物项", desc: "使用美国原产设备生产", riskScore: 70, legalBasis: "EAR 15 CFR 734.3" },
        { id: "dual_use_tech", name: "军民两用技术", desc: "涉及军民两用技术（Wassenaar Arrangement）", riskScore: 80, legalBasis: "EAR 15 CFR 744 + 瓦森纳安排" },
      ]
    },
    // 人员连接点
    personnel: {
      name: "人员连接点",
      weight: 0.15,
      indicators: [
        { id: "us_person", name: "美国人参与", desc: "美国公民、绿卡持有者或美国公司雇员参与交易", riskScore: 90, legalBasis: "31 CFR 501.603 (US person facilitation)" },
        { id: "us_management", name: "美籍管理层", desc: "公司管理层含美国籍人士", riskScore: 75, legalBasis: "31 CFR 501 ( Facilitation)" },
        { id: "board_member_us", name: "美国董事", desc: "董事会含美国籍董事", riskScore: 70, legalBasis: "31 CFR 501.603" },
        { id: "employee_in_us", name: "美国境内员工", desc: "员工在美国境内执行交易", riskScore: 80, legalBasis: "31 CFR 501.603" },
      ]
    },
    // 业务连接点
    business: {
      name: "业务连接点",
      weight: 0.20,
      indicators: [
        { id: "us_platform", name: "美国平台销售", desc: "通过Amazon、eBay等美国平台销售", riskScore: 70, legalBasis: "平台服务条款 + 31 CFR 501" },
        { id: "us_intermediary", name: "美国中间商", desc: "使用美国贸易公司或代理商", riskScore: 75, legalBasis: "31 CFR 501 (re-export)" },
        { id: "us_shipping", name: "美国航运/物流", desc: "使用美国船公司、航空公司或物流公司", riskScore: 65, legalBasis: "31 CFR 501 + 航运制裁" },
        { id: "insurance_us", name: "美国保险", desc: "使用美国保险公司承保", riskScore: 60, legalBasis: "31 CFR 501 (insurance facilitation)" },
        { id: "cloud_us", name: "美国云服务", desc: "使用AWS/Azure/GCP等美国云服务", riskScore: 55, legalBasis: "EAR 15 CFR 744.23 (cloud computing)" },
      ]
    },
    // 货物连接点
    goods: {
      name: "货物连接点",
      weight: 0.10,
      indicators: [
        { id: "goods_transit_us", name: "货物经美国转运", desc: "货物途经美国领土或保税区", riskScore: 85, legalBasis: "31 CFR 501.603 (transit)" },
        { id: "us_origin_goods", name: "美国原产货物", desc: "出口货物为美国原产", riskScore: 80, legalBasis: "EAR 15 CFR 734.3" },
        { id: "controlled_commodity", name: "受控商品", desc: "商品属于出口管制清单", riskScore: 75, legalBasis: "EAR 15 CFR 774 (CCL)" },
        { id: "end_use_military", name: "军事最终用途", desc: "已知或应知最终军事用途", riskScore: 90, legalBasis: "EAR 15 CFR 744.21 (Military End Use/User)" },
      ]
    }
  };

  // --------------------------------------------------------
  // 4. 穿透分析规则（母公司/子公司/关联公司）
  // --------------------------------------------------------
  const PENETRATION_RULES = {
    directOwnership: { name: "直接持股", threshold: 0.50, riskMultiplier: 1.0, desc: "直接持有50%以上股权" },
    indirectOwnership: { name: "间接持股", threshold: 0.50, riskMultiplier: 0.95, desc: "通过多层架构间接控股50%以上" },
    majorityControl: { name: "实际控制", threshold: 0.30, riskMultiplier: 0.85, desc: "虽持股<50%但拥有实际控制权（董事会、投票权）" },
    significantInfluence: { name: "重大影响", threshold: 0.10, riskMultiplier: 0.70, desc: "持股10-30%或具有重大影响" },
    jointVenture: { name: "合资企业", threshold: 0.00, riskMultiplier: 0.80, desc: "与制裁实体成立合资企业" },
    commonDirector: { name: "共同董事", threshold: 0.00, riskMultiplier: 0.65, desc: "与制裁实体共享关键管理人员" },
    sameGroup: { name: "同一集团", threshold: 0.00, riskMultiplier: 0.90, desc: "同属一个母公司集团" },
  };

  // --------------------------------------------------------
  // 5. 出口管制分类（ECCN）参考数据
  // --------------------------------------------------------
  const ECCN_CATEGORIES = {
    "3A001": { desc: "电子元件（高性能处理器）", controlReason: "NS/MT", usContent: "高", riskLevel: "high" },
    "3A090": { desc: "先进计算芯片（AI芯片）", controlReason: "RS/AT", usContent: "高", riskLevel: "critical" },
    "3A991": { desc: "通用电子元件", controlReason: "AT", usContent: "低", riskLevel: "medium" },
    "4A003": { desc: "数字计算机/服务器", controlReason: "NS/AT", usContent: "中", riskLevel: "medium" },
    "5A002": { desc: "信息安全设备", controlReason: "NS/AT", usContent: "中", riskLevel: "high" },
    "5A992": { desc: "民用通信设备", controlReason: "AT", usContent: "低", riskLevel: "low" },
    "6A003": { desc: "光学/摄像设备（含监控）", controlReason: "NS/AT", usContent: "中", riskLevel: "high" },
    "7A001": { desc: "导航/航空电子设备", controlReason: "NS/MT", usContent: "高", riskLevel: "high" },
    "9A515": { desc: "航天器及相关设备", controlReason: "NS/MT/RS", usContent: "高", riskLevel: "critical" },
    "0A979": { desc: "军事训练/仿真设备", controlReason: "SL", usContent: "高", riskLevel: "critical" },
    "EAR99": { desc: "未列入CCL的EAR管辖物项", controlReason: "AT", usContent: "低", riskLevel: "low" },
  };

  // --------------------------------------------------------
  // 6. 核心函数：增强版制裁扫描引擎
  // --------------------------------------------------------
  
  /**
   * 计算连接点风险评分（0-100）
   */
  function calculateConnectionPointRisk(connectionPoints) {
    let totalScore = 0;
    let totalWeight = 0;
    const dimensionScores = [];
    
    for (const [dimKey, dimension] of Object.entries(CONNECTION_POINT_MATRIX)) {
      let dimScore = 0;
      let triggeredCount = 0;
      const triggered = [];
      
      for (const indicator of dimension.indicators) {
        if (connectionPoints.includes(indicator.id)) {
          dimScore += indicator.riskScore;
          triggeredCount++;
          triggered.push({
            id: indicator.id,
            name: indicator.name,
            desc: indicator.desc,
            score: indicator.riskScore,
            legalBasis: indicator.legalBasis
          });
        }
      }
      
      // 维度得分 = 平均触发的风险分 × 饱和系数
      const avgScore = triggeredCount > 0 ? dimScore / triggeredCount : 0;
      const saturationFactor = Math.min(1, triggeredCount / dimension.indicators.length * 2); // 触发越多，系数越高
      const dimensionScore = avgScore * saturationFactor;
      
      totalScore += dimensionScore * dimension.weight;
      totalWeight += dimension.weight;
      
      dimensionScores.push({
        dimension: dimension.name,
        weight: dimension.weight,
        score: Math.round(dimensionScore),
        triggered: triggered,
        triggeredCount: triggeredCount
      });
    }
    
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;
    
    return {
      score: finalScore,
      level: finalScore >= 80 ? "critical" : finalScore >= 60 ? "high" : finalScore >= 40 ? "medium" : finalScore >= 20 ? "low" : "minimal",
      dimensions: dimensionScores,
      summary: generateConnectionSummary(dimensionScores)
    };
  }
  
  function generateConnectionSummary(dimScores) {
    const highest = dimScores.sort((a,b) => b.score - a.score)[0];
    if (!highest || highest.score === 0) return "未检测到显著连接点风险";
    return `最高风险维度：${highest.dimension}（${highest.score}分），触发${highest.triggeredCount}个指标`;
  }

  /**
   * 穿透分析：查找关联实体
   */
  function performPenetrationAnalysis(entityId, depth = 2) {
    const entity = ENHANCED_ENTITY_DB.find(e => e.id === entityId);
    if (!entity) return null;
    
    const result = {
      root: entity,
      layers: [],
      totalRiskScore: entity.riskLevel === "critical" ? 100 : entity.riskLevel === "high" ? 75 : 50,
      maxDepth: depth
    };
    
    // 第一层：直接关联
    const directRelated = ENHANCED_ENTITY_DB.filter(e => entity.related.includes(e.id));
    if (directRelated.length > 0) {
      result.layers.push({
        depth: 1,
        relationType: "直接关联",
        entities: directRelated.map(e => ({
          id: e.id,
          name: e.name,
          list: e.list,
          riskLevel: e.riskLevel,
          legalBasis: e.legalBasis
        }))
      });
    }
    
    // 第二层：通过别名/关键词关联
    if (depth >= 2) {
      const aliases = entity.aliases;
      const keywordMatches = ENHANCED_ENTITY_DB.filter(e => {
        if (e.id === entity.id || entity.related.includes(e.id)) return false;
        return e.aliases.some(a => aliases.some(ia => a.toLowerCase().includes(ia.toLowerCase()) || ia.toLowerCase().includes(a.toLowerCase())));
      }).slice(0, 5);
      
      if (keywordMatches.length > 0) {
        result.layers.push({
          depth: 2,
          relationType: "疑似关联（别名匹配）",
          entities: keywordMatches.map(e => ({
            id: e.id,
            name: e.name,
            list: e.list,
            riskLevel: e.riskLevel,
            legalBasis: e.legalBasis
          }))
        });
      }
    }
    
    // 计算综合穿透风险
    const allRelated = result.layers.flatMap(l => l.entities);
    const criticalCount = allRelated.filter(e => e.riskLevel === "critical").length;
    const highCount = allRelated.filter(e => e.riskLevel === "high").length;
    result.totalRiskScore = Math.min(100, result.totalRiskScore + criticalCount * 15 + highCount * 10);
    result.relatedCount = allRelated.length;
    
    return result;
  }

  /**
   * 增强版国家风险扫描
   */
  function enhancedCountryScan(countryId, productCategory = "", connectionPoints = []) {
    const country = ENHANCED_COUNTRY_SANCTIONS[countryId.toUpperCase()];
    if (!country) {
      return {
        countryRisk: { level: "unknown", reasons: ["未收录该国家数据"] },
        multiCountryRisk: {},
        entityMatches: [],
        secondaryRisk: { level: "low", scenarios: [] },
        recommendations: ["请手动评估该国家制裁风险"]
      };
    }
    
    const reasons = [...country.redFlags];
    const recommendations = [];
    
    // 根据制裁级别生成建议
    if (country.usSanctionLevel === "comprehensive") {
      recommendations.push("⚠️ 强烈建议暂停与该市场的直接贸易");
      recommendations.push("💡 如需维持业务，请咨询专业律师评估替代方案");
      recommendations.push("🔄 在「准入查询」中查看替代市场推荐");
    } else if (country.usSanctionLevel === "sectoral") {
      recommendations.push("⚠️ 特定行业/实体受限，需逐笔审查");
      recommendations.push("📋 确认交易对手不在SDN/Entity List上");
      recommendations.push("🔍 使用「制裁扫描」查交易对手");
    } else {
      recommendations.push("✅ 常规合规即可，定期关注热点雷达政策变化");
    }
    
    // 支付风险
    if (country.paymentRisk === "swift_cut") {
      reasons.push("SWIFT跨境支付通道已被切断");
      recommendations.push("🚫 避免使用美元结算和SWIFT转账");
      recommendations.push("💱 考虑人民币结算或易货贸易");
    } else if (country.paymentRisk === "full_block") {
      reasons.push("金融通道全面封锁");
      recommendations.push("🚫 所有跨境支付均受限");
    }
    
    // 出口管制
    if (country.exportControl && country.exportControl !== "无") {
      reasons.push(`出口管制：${country.exportControl}`);
    }
    
    // 匹配该国家实体
    const entityMatches = ENHANCED_ENTITY_DB.filter(e => 
      e.country === country.name || countryId.toUpperCase().includes(e.country) || e.country.includes(countryId)
    );
    
    // 连接点分析
    const connectionAnalysis = calculateConnectionPointRisk(connectionPoints);
    
    // 二级风险（场景分析）
    const secondaryScenarios = [];
    if (connectionPoints.includes("usd_settlement") && country.usSanctionLevel !== "none") {
      secondaryScenarios.push({
        scenario: "美元结算制裁风险",
        desc: `使用美元与${country.name}交易，可能被OFAC认定为违反一级制裁`,
        riskScore: 90,
        legalBasis: "31 CFR 501.603 + OFAC Enforcement Guidelines"
      });
    }
    if (connectionPoints.includes("us_tech_content") && country.usSanctionLevel !== "none") {
      secondaryScenarios.push({
        scenario: "技术出口管制风险",
        desc: `含美国技术成分的产品出口至${country.name}，可能触发BIS出口管制`,
        riskScore: 85,
        legalBasis: "EAR 15 CFR 734.4 + 15 CFR 744"
      });
    }
    if (connectionPoints.includes("us_platform") && country.usSanctionLevel !== "none") {
      secondaryScenarios.push({
        scenario: "美国平台制裁风险",
        desc: `通过Amazon等平台向${country.name}销售，平台可能冻结账户和资金`,
        riskScore: 70,
        legalBasis: "平台服务条款 + 31 CFR 501"
      });
    }
    
    // 出口管制分析（按产品类别）
    const exportControlAnalysis = analyzeExportControl(productCategory, countryId);
    
    return {
      countryRisk: {
        level: country.usSanctionLevel === "comprehensive" ? "critical" : country.usSanctionLevel === "sectoral" ? "high" : "low",
        reasons: reasons,
        countryName: country.name,
        countryNameEn: country.nameEn
      },
      multiCountryRisk: {
        us: { level: country.usSanctionLevel, flags: country.usSanctionLevel !== "none" ? country.redFlags : [], legalBasis: country.usSanctionLevel === "comprehensive" ? "EO 13850/13902/14024 + 31 CFR" : country.usSanctionLevel === "sectoral" ? "EAR 15 CFR 744 + Entity List" : "" },
        eu: { level: country.euSanctionLevel, flags: country.euSanctionLevel !== "none" ? ["欧盟联合制裁"] : [], legalBasis: country.euSanctionLevel !== "none" ? "EU Regulation 833/2014, 765/2006" : "" },
        uk: { level: country.ukSanctionLevel, flags: country.ukSanctionLevel !== "none" ? ["英国制裁"] : [], legalBasis: country.ukSanctionLevel !== "none" ? "UK Sanctions and Anti-Money Laundering Act 2018" : "" },
        un: { level: country.unSanctionLevel, flags: country.unSanctionLevel !== "none" ? ["联合国安理会制裁"] : [], legalBasis: country.unSanctionLevel !== "none" ? "UN SCR 1718, 2231, 1988" : "" },
        cn: { level: country.cnSanctionLevel, flags: country.cnSanctionLevel !== "none" ? ["中国反制裁"] : [], legalBasis: country.cnSanctionLevel !== "none" ? "《反外国制裁法》" : "" }
      },
      entityMatches: entityMatches,
      entityMatchCount: entityMatches.length,
      secondaryRisk: {
        level: connectionAnalysis.level,
        scenarios: secondaryScenarios,
        connectionAnalysis: connectionAnalysis
      },
      exportControlAnalysis: exportControlAnalysis,
      recommendations: recommendations,
      financialRestrictions: country.financialRestrictions,
      sectoralRisks: country.sectoralRisks
    };
  }
  
  /**
   * 出口管制分析
   */
  function analyzeExportControl(productCategory, countryId) {
    const country = ENHANCED_COUNTRY_SANCTIONS[countryId.toUpperCase()];
    if (!country || country.usSanctionLevel === "none") {
      return { required: false, reason: "该国家无出口管制限制" };
    }
    
    const relevantECCN = [];
    
    if (productCategory.toLowerCase().includes("电子") || productCategory.toLowerCase().includes("electronics")) {
      relevantECCN.push("3A001", "3A090", "3A991", "4A003", "5A002");
    }
    if (productCategory.toLowerCase().includes("芯片") || productCategory.toLowerCase().includes("半导体") || productCategory.toLowerCase().includes("chip")) {
      relevantECCN.push("3A001", "3A090", "3A991");
    }
    if (productCategory.toLowerCase().includes("监控") || productCategory.toLowerCase().includes("camera") || productCategory.toLowerCase().includes("AI")) {
      relevantECCN.push("6A003", "5A002");
    }
    if (productCategory.toLowerCase().includes("航空") || productCategory.toLowerCase().includes("aerospace") || productCategory.toLowerCase().includes("卫星")) {
      relevantECCN.push("7A001", "9A515");
    }
    if (productCategory.toLowerCase().includes("无人机") || productCategory.toLowerCase().includes("drone") || productCategory.toLowerCase().includes("UAV")) {
      relevantECCN.push("9A515", "6A003");
    }
    if (productCategory.toLowerCase().includes("通信") || productCategory.toLowerCase().includes("telecom") || productCategory.toLowerCase().includes("5G")) {
      relevantECCN.push("5A002", "5A992", "3A001");
    }
    if (productCategory.toLowerCase().includes("军事") || productCategory.toLowerCase().includes("defense") || productCategory.toLowerCase().includes("军工")) {
      relevantECCN.push("0A979", "9A515", "7A001");
    }
    
    // 去重
    const uniqueECCN = [...new Set(relevantECCN)];
    const eccnDetails = uniqueECCN.map(code => ({
      code: code,
      ...ECCN_CATEGORIES[code]
    }));
    
    const hasCritical = eccnDetails.some(e => e.riskLevel === "critical");
    const hasHigh = eccnDetails.some(e => e.riskLevel === "high");
    
    return {
      required: true,
      reason: country.usSanctionLevel === "comprehensive" ? "EAR全面禁运，需出口许可证" : "EAR出口管制，需确认ECCN分类",
      eccnList: eccnDetails,
      licenseRequired: country.usSanctionLevel === "comprehensive" || hasCritical || hasHigh,
      riskLevel: country.usSanctionLevel === "comprehensive" ? "critical" : hasCritical ? "critical" : hasHigh ? "high" : "medium",
      legalBasis: "EAR 15 CFR 730-774 + Export Administration Act"
    };
  }

  /**
   * 实体搜索（增强版，支持别名和模糊匹配）
   */
  function searchEntity(query) {
    if (!query || query.trim().length === 0) return [];
    
    const q = query.toLowerCase().trim();
    const results = [];
    
    for (const entity of ENHANCED_ENTITY_DB) {
      let score = 0;
      
      // 精确匹配名称
      if (entity.name.toLowerCase() === q) score += 100;
      else if (entity.name.toLowerCase().includes(q)) score += 80;
      
      // 别名匹配
      for (const alias of entity.aliases) {
        if (alias.toLowerCase() === q) score += 90;
        else if (alias.toLowerCase().includes(q)) score += 70;
      }
      
      // 国家匹配
      if (entity.country.toLowerCase() === q) score += 60;
      else if (entity.country.toLowerCase().includes(q)) score += 40;
      
      // 标签匹配
      for (const tag of entity.tags) {
        if (tag.toLowerCase().includes(q)) score += 30;
      }
      
      // ID匹配
      if (entity.id.toLowerCase().includes(q)) score += 50;
      
      // 法律依据匹配
      if (entity.legalBasis.toLowerCase().includes(q)) score += 20;
      
      if (score > 0) {
        results.push({ ...entity, matchScore: score });
      }
    }
    
    // 按匹配分数排序
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    return results.slice(0, 10); // 返回前10个
  }

  /**
   * 生成综合扫描报告
   */
  function generateSanctionReport(countryId, productCategory, entityQuery, connectionPoints) {
    const countryScan = enhancedCountryScan(countryId, productCategory, connectionPoints);
    const entitySearch = entityQuery ? searchEntity(entityQuery) : [];
    
    // 对搜索到的实体进行穿透分析
    const entityPenetrations = entitySearch.slice(0, 3).map(e => performPenetrationAnalysis(e.id, 2));
    
    // 计算总体风险评分
    let totalRiskScore = 0;
    const riskFactors = [];
    
    // 国家风险评分
    const countryRiskScore = countryScan.countryRisk.level === "critical" ? 100 : countryScan.countryRisk.level === "high" ? 70 : 30;
    totalRiskScore += countryRiskScore * 0.35;
    riskFactors.push({ factor: "国家制裁风险", weight: 0.35, score: countryRiskScore, level: countryScan.countryRisk.level });
    
    // 实体匹配评分
    const entityRiskScore = entitySearch.length > 0 ? Math.min(100, entitySearch[0].riskLevel === "critical" ? 100 : entitySearch[0].riskLevel === "high" ? 75 : 50) : 0;
    totalRiskScore += entityRiskScore * 0.30;
    riskFactors.push({ factor: "实体匹配风险", weight: 0.30, score: entityRiskScore, level: entitySearch.length > 0 ? entitySearch[0].riskLevel : "none" });
    
    // 连接点评分
    const connectionScore = countryScan.secondaryRisk.connectionAnalysis.score;
    totalRiskScore += connectionScore * 0.20;
    riskFactors.push({ factor: "连接点风险", weight: 0.20, score: connectionScore, level: countryScan.secondaryRisk.connectionAnalysis.level });
    
    // 出口管制评分
    const exportScore = countryScan.exportControlAnalysis && countryScan.exportControlAnalysis.riskLevel ? 
      (countryScan.exportControlAnalysis.riskLevel === "critical" ? 100 : countryScan.exportControlAnalysis.riskLevel === "high" ? 70 : 40) : 0;
    totalRiskScore += exportScore * 0.15;
    riskFactors.push({ factor: "出口管制风险", weight: 0.15, score: exportScore, level: countryScan.exportControlAnalysis ? countryScan.exportControlAnalysis.riskLevel : "none" });
    
    const finalScore = Math.round(totalRiskScore);
    const overallLevel = finalScore >= 80 ? "critical" : finalScore >= 60 ? "high" : finalScore >= 40 ? "medium" : finalScore >= 20 ? "low" : "minimal";
    
    return {
      scanTime: new Date().toISOString(),
      overallRisk: {
        score: finalScore,
        level: overallLevel,
        label: overallLevel === "critical" ? "极高风险" : overallLevel === "high" ? "高风险" : overallLevel === "medium" ? "中风险" : overallLevel === "low" ? "低风险" : "极低风险"
      },
      riskFactors: riskFactors,
      countryScan: countryScan,
      entitySearch: entitySearch,
      entityPenetrations: entityPenetrations,
      exportControl: countryScan.exportControlAnalysis,
      legalBasis: {
        country: countryScan.multiCountryRisk,
        exportControl: countryScan.exportControlAnalysis ? countryScan.exportControlAnalysis.legalBasis : "",
        entityList: entitySearch.length > 0 ? entitySearch.map(e => ({ id: e.id, list: e.list, legalBasis: e.legalBasis })) : []
      }
    };
  }

  // --------------------------------------------------------
  // 7. 暴露到全局（供主应用调用）
  // --------------------------------------------------------
  window.LawFlowSanctionEnhanced = {
    entityDB: ENHANCED_ENTITY_DB,
    countrySanctions: ENHANCED_COUNTRY_SANCTIONS,
    connectionMatrix: CONNECTION_POINT_MATRIX,
    penetrationRules: PENETRATION_RULES,
    eccnCategories: ECCN_CATEGORIES,
    
    // 核心函数
    searchEntity: searchEntity,
    enhancedCountryScan: enhancedCountryScan,
    calculateConnectionPointRisk: calculateConnectionPointRisk,
    performPenetrationAnalysis: performPenetrationAnalysis,
    analyzeExportControl: analyzeExportControl,
    generateSanctionReport: generateSanctionReport,
    
    // 工具函数
    getEntityById: (id) => ENHANCED_ENTITY_DB.find(e => e.id === id),
    getEntitiesByCountry: (country) => ENHANCED_ENTITY_DB.filter(e => e.country === country || e.country.includes(country)),
    getEntitiesByList: (list) => ENHANCED_ENTITY_DB.filter(e => e.list === list),
    getAllLists: () => [...new Set(ENHANCED_ENTITY_DB.map(e => e.list))],
    getEntityCount: () => ENHANCED_ENTITY_DB.length,
    
    // 版本信息
    version: "2.0.0-legal",
    lastUpdated: "2025-06-28"
  };

  console.log("[LawFlow] 制裁扫描增强模块 v2.0 已加载");
  console.log(`[LawFlow] 实体数据库: ${ENHANCED_ENTITY_DB.length} 条`);
  console.log(`[LawFlow] 国家数据: ${Object.keys(ENHANCED_COUNTRY_SANCTIONS).length} 个`);
  console.log(`[LawFlow] 连接点维度: ${Object.keys(CONNECTION_POINT_MATRIX).length} 个`);

})();