const EURO_FLAG_DEBUG_STORAGE="euroFlagDebugV1";
const WIKIMEDIA_FLAG_REDIRECT="https://commons.wikimedia.org/wiki/Special:Redirect/file/";
let flagSequence=0;

function flagUrl(file){
  return `${WIKIMEDIA_FLAG_REDIRECT}${encodeURIComponent(file)}`;
}

const flagPeriod=(from,to,file,label)=>({from,to,file,label});
// Periods are shared variables so every year in the same historical interval
// resolves to exactly one documented flag file.
const FLAG_PERIODS={
  franceBourbon:flagPeriod(1816,1829,"White flag of France.svg","法国王国波旁复辟旗"),
  franceTricolour:flagPeriod(1830,2026,"Flag of France.svg","法国三色旗"),
  austriaEmpire:flagPeriod(1816,1918,"Flag of the Austrian Empire.svg","奥地利帝国/奥地利部分旗"),
  austriaFirstRepublic:flagPeriod(1919,1933,"Flag of Austria (1230–1934, 1945–2000).svg","奥地利第一共和国旗"),
  austriaFederalState:flagPeriod(1934,1938,"State flag of Austria (1934–1938).svg","奥地利联邦国旗"),
  austriaAnschluss:flagPeriod(1938,1945,"Flag of Germany (1935–1945).svg","德意志国旗（奥地利并入时期）"),
  austriaRepublic:flagPeriod(1945,2026,"Flag of Austria.svg","奥地利共和国旗"),
  germanEmpire:flagPeriod(1871,1918,"Flag of the German Empire.svg","德意志帝国旗"),
  weimarGermany:flagPeriod(1919,1933,"Flag of Germany.svg","魏玛共和国国旗"),
  naziGermany:flagPeriod(1933,1945,"Flag of Germany (1935–1945).svg","德意志国/纳粹德国国旗"),
  russianImperial1816:flagPeriod(1816,1857,"Flag of Russia.svg","俄罗斯帝国旗"),
  russianImperial1858:flagPeriod(1858,1895,"Flag of Russia (1858–1896).svg","俄罗斯帝国黑黄白国旗"),
  russianImperial1896:flagPeriod(1896,1916,"Flag of Russia (1896–1918).svg","俄罗斯帝国白蓝红国旗"),
  rsfsrRevolution:flagPeriod(1917,1918,"Flag of Russia (1918).svg","俄罗斯苏维埃联邦社会主义共和国早期红旗"),
  rsfsr1918:flagPeriod(1918,1924,"Flag of the Russian Soviet Federative Socialist Republic (1918–1925).svg","俄罗斯苏维埃联邦社会主义共和国旗"),
  rsfsr1925:flagPeriod(1925,1936,"Flag of the Russian Soviet Federative Socialist Republic (1925–1937).svg","俄罗斯苏维埃联邦社会主义共和国旗"),
  rsfsr1937:flagPeriod(1937,1954,"Flag of the Russian Soviet Federative Socialist Republic (1937–1954).svg","俄罗斯苏维埃联邦社会主义共和国旗"),
  rsfsr1954:flagPeriod(1954,1991,"Flag of the Russian Soviet Federative Socialist Republic (1954–1991).svg","俄罗斯苏维埃联邦社会主义共和国旗"),
  ussr1922:flagPeriod(1922,1923,"Flag of the Soviet Union (1922–1923).svg","苏联国旗（第一版）"),
  ussr1923:flagPeriod(1923,1924,"Flag of the Soviet Union (1923–1924).svg","苏联国旗（第二版）"),
  ussr1924:flagPeriod(1924,1936,"Flag of the Soviet Union (1924–1936).svg","苏联国旗（第三版）"),
  ussr1936:flagPeriod(1936,1955,"Flag of the Soviet Union (1936–1955).svg","苏联国旗（第四版）"),
  ussr1955:flagPeriod(1955,1991,"Flag of the Soviet Union (1955–1991).svg","苏联国旗（第五版）"),
  russianFederation:flagPeriod(1992,2026,"Flag of Russia.svg","俄罗斯联邦国旗")
};

// Current fallback files are deliberately real Wikimedia Commons files. Period-specific
// records below override these when a historical flag is known for the selected year.
const CURRENT_FLAG_FILES={
  uk:"Flag of the United Kingdom.svg", ireland:"Flag of Ireland.svg", france:"Flag of France.svg",
  spain:"Flag of Spain.svg", portugal:"Flag of Portugal.svg", netherlands:"Flag of the Netherlands.svg",
  belgium:"Flag of Belgium.svg", germany:"Flag of Germany.svg", westGermany:"Flag of Germany.svg",
  eastGermany:"Flag of East Germany.svg", italy:"Flag of Italy.svg", austria:"Flag of Austria.svg",
  austriaEmpire:"Flag of Austria.svg", austriaHungary:"Flag of Austria-Hungary (1867–1918).svg",
  poland:"Flag of Poland.svg", russia:"Flag of Russia.svg", sovietUnion:"Flag of the Soviet Union.svg",
  sovietRussia:"Flag of the Russian Soviet Federative Socialist Republic (1918–1937).svg",
  ukraine:"Flag of Ukraine.svg", greece:"Flag of Greece.svg", turkey:"Flag of Turkey.svg",
  ottoman:"Flag of the Ottoman Empire (1844–1922).svg", sweden:"Flag of Sweden.svg", norway:"Flag of Norway.svg",
  denmark:"Flag of Denmark.svg", finland:"Flag of Finland.svg", switzerland:"Flag of Switzerland.svg",
  czechia:"Flag of the Czech Republic.svg", czechoslovakia:"Flag of Czechoslovakia.svg",
  slovakia:"Flag of Slovakia.svg", hungary:"Flag of Hungary.svg", romania:"Flag of Romania.svg",
  bulgaria:"Flag of Bulgaria.svg", albania:"Flag of Albania.svg", serbia:"Flag of Serbia.svg",
  montenegro:"Flag of Montenegro.svg", croatia:"Flag of Croatia.svg", slovenia:"Flag of Slovenia.svg",
  "bosnia-herzegovina":"Flag of Bosnia and Herzegovina.svg", kosovo:"Flag of Kosovo.svg",
  "macedonia-fyrom-north-macedonia":"Flag of North Macedonia.svg", moldova:"Flag of Moldova.svg",
  belarus:"Flag of Belarus.svg", estonia:"Flag of Estonia.svg", latvia:"Flag of Latvia.svg",
  lithuania:"Flag of Lithuania.svg", armenia:"Flag of Armenia.svg", azerbaijan:"Flag of Azerbaijan.svg",
  georgia:"Flag of Georgia.svg", cyprus:"Flag of Cyprus.svg", malta:"Flag of Malta.svg",
  luxembourg:"Flag of Luxembourg.svg", iceland:"Flag of Iceland.svg", liechtenstein:"Flag of Liechtenstein.svg",
  andorra:"Flag of Andorra.svg", monaco:"Flag of Monaco.svg", sanMarino:"Flag of San Marino.svg",
  prussia:"Flag of Prussia (1892-1918).svg", germanEmpire:"Flag of the German Empire.svg",
  papal:"Flag of the Papal States (1808–1870).svg", piedmont:"Flag of the Kingdom of Sardinia (1816).svg",
  twoSicilies:"Flag of the Kingdom of the Two Sicilies (1816–1848).svg", danzig:"Flag of the Free City of Danzig.svg"
};

// [first year, last year, Wikimedia Commons filename, display/source label]
const HISTORICAL_FLAG_PERIODS={
  france:[FLAG_PERIODS.franceBourbon,FLAG_PERIODS.franceTricolour],
  spain:[[1816,1843,"Royal Standard of Spain.svg","西班牙王室旗"],[1843,2026,"Flag of Spain.svg","西班牙国旗"]],
  portugal:[[1816,1821,"Flag of the United Kingdom of Portugal, Brazil and the Algarves.svg","葡萄牙、巴西和阿尔加维联合王国旗"],[1821,1910,"Flag of Portugal (1830–1910).svg","葡萄牙王国旗"],[1910,2026,"Flag of Portugal.svg","葡萄牙国旗"]],
  prussia:[[1816,1891,"Flag of Prussia (1803).gif","普鲁士王国旗"],[1892,1918,"Flag of Prussia (1892-1918).svg","普鲁士王国旗"],[1919,1945,"Flag of Prussia.svg","普鲁士自由邦旗"]],
  germanEmpire:[FLAG_PERIODS.germanEmpire],
  germany:[[1816,1918,"Flag of the German Empire.svg","德意志帝国旗"],FLAG_PERIODS.weimarGermany,FLAG_PERIODS.naziGermany,[1945,1949,"Flag of Germany.svg","盟国占领时期德国旗"],[1990,2026,"Flag of Germany.svg","德意志联邦共和国国旗"]],
  austria: [FLAG_PERIODS.austriaEmpire,FLAG_PERIODS.austriaFirstRepublic,FLAG_PERIODS.austriaFederalState,FLAG_PERIODS.austriaAnschluss,FLAG_PERIODS.austriaRepublic],
  austriaEmpire:[FLAG_PERIODS.austriaEmpire],
  austriaHungary:[[1867,1918,"Flag of Austria-Hungary (1867–1918).svg","奥匈帝国旗"]],
  italy:[[1816,1860,"Flag of the Kingdom of Sardinia (1816).svg","撒丁王国旗"],[1861,1946,"Flag of Kingdom of Italy.png","意大利王国旗"],[1946,2026,"Flag of Italy.svg","意大利共和国国旗"]],
  papal:[[1816,1870,"Flag of the Papal States (1808–1870).svg","教皇国旗"]],
  piedmont:[[1816,1861,"Flag of the Kingdom of Sardinia (1816).svg","撒丁王国旗"]],
  twoSicilies:[[1816,1848,"Flag of the Kingdom of the Two Sicilies (1816–1848).svg","两西西里王国旗"],[1848,1860,"Flag of the Kingdom of the Two Sicilies (1848–1860).svg","两西西里王国旗"]],
  ottoman:[[1816,1843,"Flag of the Ottoman Empire (1793–1844).svg","奥斯曼帝国旗"],[1844,1922,"Flag of the Ottoman Empire (1844–1922).svg","奥斯曼帝国旗"]],
  turkey:[[1923,2026,"Flag of Turkey.svg","土耳其共和国国旗"]],
  russia:[FLAG_PERIODS.russianImperial1816,FLAG_PERIODS.russianImperial1858,FLAG_PERIODS.russianImperial1896,FLAG_PERIODS.russianFederation],
  sovietUnion:[FLAG_PERIODS.ussr1922,FLAG_PERIODS.ussr1923,FLAG_PERIODS.ussr1924,FLAG_PERIODS.ussr1936,FLAG_PERIODS.ussr1955],
  sovietRussia:[FLAG_PERIODS.rsfsrRevolution,FLAG_PERIODS.rsfsr1918,FLAG_PERIODS.rsfsr1925,FLAG_PERIODS.rsfsr1937,FLAG_PERIODS.rsfsr1954],
  poland:[[1816,1918,"Flag of Congress Poland.svg","波兰会议王国旗"],[1918,2026,"Flag of Poland.svg","波兰国旗"]],
  greece:[[1830,1978,"Flag of Greece (1822–1978).svg","希腊王国/共和国旗"],[1978,2026,"Flag of Greece.svg","希腊国旗"]],
  czechoslovakia:[[1918,1992,"Flag of Czechoslovakia.svg","捷克斯洛伐克国旗"]],
  yugoslavia:[[1918,1945,"Flag of the Kingdom of Yugoslavia.svg","南斯拉夫王国旗"],[1945,1991,"Flag of Yugoslavia (1945–1992).svg","南斯拉夫社会主义联邦共和国旗"]],serbiaMontenegro:[[2003,2006,"Flag of Serbia and Montenegro.svg","塞尔维亚和黑山国旗"]],
  eastGermany:[[1949,1990,"Flag of East Germany.svg","德意志民主共和国国旗"]],
  westGermany:[[1949,1990,"Flag of Germany.svg","德意志联邦共和国国旗"]],
  danzig:[[1919,1939,"Flag of the Free City of Danzig.svg","但泽自由市旗"]]
};

function flagRecordFor(id,year){
  const y=Number.isFinite(Number(year))?Number(year):2026;
  const periods=HISTORICAL_FLAG_PERIODS[id]||[];
  const period=periods.find(row=>y>=row[0]&&y<=row[1]);
  const file=period?.file||period?.[2]||CURRENT_FLAG_FILES[id]||"Flag of Germany.svg";
  const fallbackFile=CURRENT_FLAG_FILES[id]||file;
  return {
    path:flagUrl(file), fallbackPath:flagUrl(fallbackFile), file,
    period:period?.label||period?.[3]||`Wikimedia Commons · ${file}`,
    source:`Wikimedia Commons · File:${file}`
  };
}

function flagAssetFor(id,year){return flagRecordFor(id,year)}

function readFlagDebug(){
  try{return JSON.parse(localStorage.getItem(EURO_FLAG_DEBUG_STORAGE)||"{}")}catch(_){return {}}
}

function flagDebugKey(id,y){return `${id}:${Number(y)||2026}`}

function flagDebugSettings(id,y){
  const saved=readFlagDebug()[flagDebugKey(id,y)]||{};
  return {scaleX:Number(saved.scaleX)||1,scaleY:Number(saved.scaleY)||1,offsetX:Number(saved.offsetX)||0,offsetY:Number(saved.offsetY)||0,rotation:Number(saved.rotation)||0,color:saved.color||"#a44e3b",flagFill:saved.flagFill||"transparent"};
}

function clearHoverVisuals(){
  if(dom.flagLayer)dom.flagLayer.innerHTML="";
  activeFlagId=null;
  activeCountries().forEach(path=>path.classList.remove("hovered"));
}

function setHoverState(id,show){
  const path=activeCountries().find(item=>item.dataset.id===id);
  if(!path||!dom.flagLayer)return;
  if(!show){
    if(activeFlagId===id)clearHoverVisuals();
    return;
  }
  clearHoverVisuals();
  activeFlagId=id;
  path.classList.add("hovered");
  const year=Number(dom.year?.value||2026);
  const asset=flagAssetFor(id,year);
  const bbox=path.getBBox();
  const safeId=String(id).replace(/[^a-zA-Z0-9_-]/g,"-");
  const clipId=`country-flag-clip-${safeId}-${++flagSequence}`;
  const defs=document.createElementNS("http://www.w3.org/2000/svg","defs");
  const clip=document.createElementNS("http://www.w3.org/2000/svg","clipPath");
  clip.setAttribute("id",clipId); clip.setAttribute("clipPathUnits","userSpaceOnUse");
  const clipPath=document.createElementNS("http://www.w3.org/2000/svg","path");
  clipPath.setAttribute("d",path.getAttribute("d")||"");
  clip.appendChild(clipPath); defs.appendChild(clip); dom.flagLayer.appendChild(defs);
  const group=document.createElementNS("http://www.w3.org/2000/svg","g");
  group.classList.add("country-flag","active-flag"); group.dataset.for=id; group.setAttribute("aria-hidden","true");
  const settings=flagDebugSettings(id,year);
  if(settings.offsetX||settings.offsetY||settings.scaleX!==1||settings.scaleY!==1){
    group.setAttribute("transform",`translate(${settings.offsetX} ${settings.offsetY}) translate(${bbox.x+bbox.width/2} ${bbox.y+bbox.height/2}) scale(${settings.scaleX} ${settings.scaleY}) translate(${-bbox.x-bbox.width/2} ${-bbox.y-bbox.height/2})`);
  }
  const image=document.createElementNS("http://www.w3.org/2000/svg","image");
  image.setAttribute("x",bbox.x); image.setAttribute("y",bbox.y); image.setAttribute("width",bbox.width); image.setAttribute("height",bbox.height);
  image.setAttribute("preserveAspectRatio","none"); image.setAttribute("clip-path",`url(#${clipId})`);
  image.setAttribute("href",asset.path); image.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",asset.path);
  image.dataset.fallback=asset.fallbackPath;
  image.addEventListener("error",()=>{if(image.getAttribute("href")!==asset.fallbackPath){image.setAttribute("href",asset.fallbackPath);image.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",asset.fallbackPath)}});
  const motion=document.createElementNS("http://www.w3.org/2000/svg","g");
  motion.classList.add("country-flag-motion");
  motion.appendChild(image); group.appendChild(motion); dom.flagLayer.appendChild(group);
}

function syncFlags(){
  const selectedId=typeof selected!=="undefined"?selected:null;
  if(!selectedId)clearHoverVisuals();
  else if(!activeFlagId)setHoverState(selectedId,true);
}

function applyFlagDebugSettings(){
  if(activeFlagId)setHoverState(activeFlagId,true);
}
