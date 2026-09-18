import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const root=process.cwd();
const mirrorFiles=[
  "app.js","formal-names.js","euro-meta-zh.js","index.html","styles.css","euro-cshapes-europe-1816-1885.js","euro-cshapes-official.js","euro-cshapes-modern-2020-2026.js","euro-cshapes.js","data/euro-modern-2020-2026.geojson",
  "euro-historical-1816-1885.js","euro-historical-1886-1999.js","euro-2026.js",
  "PROJECT_CONTEXT.md","README.md",
  "modules/boundary-debug.js","modules/core.js","modules/events.js",
  "modules/flags.js","modules/lazy-loader.js","modules/map.js",
  "assets/flags/SOURCES.md"
];
const jsFiles=[...mirrorFiles.filter(file=>file.endsWith(".js")),"scripts/import-cshapes-europe.mjs","scripts/verify.mjs"];
const digest=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};

for(const file of mirrorFiles){
  const source=path.join(root,file),copy=path.join(root,"dist",file);
  check(fs.existsSync(source),`缺少根目录文件：${file}`);
  check(fs.existsSync(copy),`缺少 dist 文件：${file}`);
  if(fs.existsSync(source)&&fs.existsSync(copy))check(digest(source)===digest(copy),`根目录与 dist 不一致：${file}`);
}

for(const file of jsFiles){
  const source=path.join(root,file);
  const args=file.endsWith(".mjs")?["--input-type=module","--check"]:["--check"];
  const result=spawnSync(process.execPath,args,{input:fs.readFileSync(source,"utf8"),encoding:"utf8"});
  check(result.status===0,`JavaScript 语法错误：${file}\n${result.stderr||result.stdout||""}`);
}

for(const htmlFile of ["index.html","dist/index.html"]){
  const html=fs.readFileSync(path.join(root,htmlFile),"utf8");
  for(const match of html.matchAll(/<script\s+src="([^"]+)"/g)){
    check(fs.existsSync(path.join(root,path.dirname(htmlFile),match[1])),`${htmlFile} 引用了不存在的脚本：${match[1]}`);
  }
}

const cshapes=fs.readFileSync(path.join(root,"euro-cshapes.js"),"utf8");
check(cshapes.includes("EURO_CSHAPES_FEATURES"),"CShapes-Europe 数据层未定义 EURO_CSHAPES_FEATURES");
check(cshapes.includes("from")&&cshapes.includes("to"),"CShapes-Europe 数据层缺少 from/to 时期字段");

if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`verify ok: ${mirrorFiles.length} mirrored files, ${jsFiles.length} JavaScript files`);
