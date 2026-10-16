// Enumerate real upstream directory filenames from a pinned GitHub commit.
// Structural data only: never publishes raw Scripture rows.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expectedFiles } from './stepbible-source-audit.js';

export async function inspectUpstream(commit,{request=fetch}={}) {
 if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('A pinned 40-hex SHA is required');
 const url='https://api.github.com/repos/STEPBible/STEPBible-Data/contents/Translators%20Amalgamated%20OT%2BNT?ref='+commit;
 const token=process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
 const headers={'Accept':'application/vnd.github+json','User-Agent':'TCF-Study-App-source-inspection'};
 if (token) headers.Authorization='Bearer '+token;
 const response=await request(url,{headers});
 if (!response.ok) throw Error('Pinned GitHub source listing failed: HTTP '+response.status+(response.status===403?' (check API rate limit / GITHUB_TOKEN permissions)':''));
 const records=await response.json();
 if (!Array.isArray(records)) throw Error('Expected a directory listing');
 const files=records.filter(x=>x.type==='file' && typeof x.name==='string').map(x=>({name:x.name,size:x.size,sha:x.sha})).sort((a,b)=>a.name.localeCompare(b.name));
 const present=new Set(files.map(x=>x.name));
 const missing=expectedFiles.filter(name=>!present.has(name));
 return {sourceCommit:commit,sourceDirectory:'Translators Amalgamated OT+NT',files,expected:expectedFiles,missingExpected:missing,canUseExistingDownloader:missing.length===0,warning:'GitHub file listing is not a validated TAGNT/TAHOT parser; source rows and textual variants still require verification.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [sha,out]=process.argv.slice(2);
 if(!sha||!out){console.error('Usage: node scripts/inspect-stepbible-upstream.js <40-hex-commit> output.json');process.exit(2)}
 const report=await inspectUpstream(sha);
 writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('Found '+report.files.length+' upstream files; missing '+report.missingExpected.length+' expected names');
 if(report.missingExpected.length)process.exitCode=1;
}
