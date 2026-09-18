import fs from "node:fs";
import path from "node:path";

const [inputFile,outputFile="euro-cshapes-imported.js"]=process.argv.slice(2);
if(!inputFile||inputFile==="--help"||inputFile==="-h"){
  console.log("用法：node scripts/import-cshapes-europe.mjs <cshapes-europe.geojson> [输出文件]");
  process.exit(inputFile?0:1);
}

const sourcePath=path.resolve(inputFile);
const outputPath=path.resolve(outputFile);
const payload=JSON.parse(fs.readFileSync(sourcePath,"utf8"));
const sourceFeatures=Array.isArray(payload)?payload:(payload.type==="FeatureCollection"?payload.features:[]);
if(!sourceFeatures.length)throw new Error("输入文件不是 GeoJSON FeatureCollection，或没有 features。");

const EUROPE={minLon:-25,maxLon:65,minLat:34,maxLat:72,width:1080,height:650};
const value=(properties,names)=>{for(const name of names){if(properties?.[name]!==undefined&&properties[name]!==null&&String(properties[name]).trim()!=="")return properties[name]}return ""};
const yearOf=value=>{const match=String(value??"").match(/-?\d{4}/);return match?Number(match[0]):null};
const numberOf=value=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:null};
const slug=value=>String(value).normalize("NFKD").replace(/[^\p{Letter}\p{Number}]+/gu,"-").replace(/^-|-$/g,"").toLowerCase()||"unknown";
const canonicalId=name=>{
  const key=String(name).toLowerCase();
  const aliases=[
    ["united kingdom","uk"],["great britain","uk"],["england","uk"],["ireland","ireland"],
    ["france","france"],["spain","spain"],["portugal","portugal"],["netherlands","netherlands"],
    ["belgium","belgium"],["german federal republic","westGermany"],["german democratic republic","eastGermany"],["germany (prussia)","prussia"],["germany","germany"],["prussia","prussia"],["austria-hungary","austriaHungary"],
    ["austria","austria"],["italy","italy"],["piedmont","piedmont"],["switzerland","switzerland"],
    ["czechoslovakia","czechoslovakia"],["czech republic","czechia"],["bohemia","czechia"],
    ["poland","poland"],["denmark","denmark"],["norway","norway"],["sweden","sweden"],
    ["finland","finland"],["russia","russia"],["soviet union","sovietUnion"],["ukraine","ukraine"],
    ["romania","romania"],["rumania","romania"],["hungary","hungary"],["yugoslavia","yugoslavia"],["bulgaria","bulgaria"],
    ["greece","greece"],["ottoman","ottoman"],["turkey","turkey"],["armenia","armenia"],["azerbaijan","azerbaijan"],["georgia","georgia"]
  ];
  return aliases.find(([alias])=>key.includes(alias))?.[1]||slug(name);
};
const EUROPEAN_IDS=new Set(["uk","ireland","netherlands","belgium","luxembourg","france","switzerland","spain","portugal","germany","prussia","westGermany","eastGermany","poland","danzig","austriaHungary","austria","hungary","czechoslovakia","czechia","slovakia","italy","malta","albania","serbia","montenegro","macedonia-fyrom-north-macedonia","croatia","yugoslavia","bosnia-herzegovina","bosnia","herzegovina","kosovo","slovenia","greece","cyprus","bulgaria","moldova","romania","russia","belarus","estonia","latvia","lithuania","ukraine","finland","sweden","norway","denmark","iceland","ottoman","turkey","armenia","azerbaijan","georgia"]);
const project=([lon,lat])=>{
  const x=(numberOf(lon)-EUROPE.minLon)/(EUROPE.maxLon-EUROPE.minLon)*EUROPE.width;
  const y=(EUROPE.maxLat-numberOf(lat))/(EUROPE.maxLat-EUROPE.minLat)*EUROPE.height;
  return [Math.round(x*100)/100,Math.round(y*100)/100];
};
const ringPath=ring=>{
  if(!Array.isArray(ring)||ring.length<3)return "";
  const points=ring.map(project).filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y));
  if(points.length<3)return "";
  return points.map(([x,y],index)=>`${index?"L":"M"}${x} ${y}`).join(" ")+" Z";
};
const geometryPath=geometry=>{
  if(!geometry)return "";
  if(geometry.type==="Polygon")return geometry.coordinates.map(ringPath).filter(Boolean).join(" ");
  if(geometry.type==="MultiPolygon")return geometry.coordinates.flatMap(polygon=>polygon.map(ringPath)).filter(Boolean).join(" ");
  if(geometry.type==="GeometryCollection")return geometry.geometries.map(geometryPath).filter(Boolean).join(" ");
  return "";
};

const imported=[];
for(const feature of sourceFeatures){
  const properties=feature.properties||{};
  const name=String(value(properties,["statename","STATE_NAME","name","NAME","SOVEREIGNT","country","cntry_name"])||feature.id||"unknown");
  const id=canonicalId(name);
  if(!EUROPEAN_IDS.has(id))continue;
  const pathData=geometryPath(feature.geometry);
  if(!pathData)continue;
  const from=yearOf(value(properties,["startdate","start_date","from","FROM","begin","gwsdate","gwsyear"]));
  const to=yearOf(value(properties,["enddate","end_date","to","TO","end","gwedate","gweyear"]));
  const gwcode=value(properties,["gwcode","GWC","gw_code","id"]);
  const status=numberOf(value(properties,["status","STATUS","type"]))??1;
  imported.push({
    id,
    gwcode:String(gwcode||""),
    name,
    from:from??1816,
    to:to??2026,
    capital:String(value(properties,["capital","CAPITAL","capitalcity","capname"])||""),
    status,
    source:"CShapes 2.0 official Shapefile import",
    path:pathData
  });
}

if(!imported.length)throw new Error("输入 GeoJSON 中没有可转换的 Polygon 或 MultiPolygon。");
const header=`// Generated by scripts/import-cshapes-europe.mjs from ${path.basename(sourcePath)}\n// Projection: ${JSON.stringify(EUROPE)}\n`;
fs.writeFileSync(outputPath,`${header}window.EURO_CSHAPES_OFFICIAL_FEATURES=${JSON.stringify(imported,null,2)};\n`,"utf8");
console.log(`imported ${imported.length} CShapes-Europe features to ${outputPath}`);
