/* Inactive, bounded one-file qualification ZIP decoder. No filesystem or imports. */
const fail=reason=>{throw Error(reason)};
const require=(v,r)=>{if(!v)fail(r)};
export async function readBounded(body,limit,signal){
 require(body,'missing-body');const reader=body.getReader(),chunks=[];let size=0;
 let onAbort;const aborted=new Promise((_,reject)=>{onAbort=()=>reject(Error('deadline'));if(signal.aborted)onAbort();else signal.addEventListener('abort',onAbort,{once:true})});
 try{for(;;){const {done,value}=await Promise.race([reader.read(),aborted]);if(done)break;size+=value.byteLength;require(size<=limit,'body-limit');chunks.push(value)}}finally{signal.removeEventListener('abort',onAbort);reader.cancel().catch(()=>{})}
 const out=new Uint8Array(size);let offset=0;for(const b of chunks){out.set(b,offset);offset+=b.length}return out;
}
export const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
export function strictJSON(bytes){
 const s=new TextDecoder('utf-8',{fatal:true}).decode(bytes);let i=0;
 const ws=()=>{while(/[\x20\t\r\n]/.test(s[i]||'x'))i++};
 const string=()=>{const start=i++;for(;i<s.length;i++){if(s[i]==='\\'){i++;continue}if(s[i]==='"'){i++;return JSON.parse(s.slice(start,i))}}fail('json-string')};
 const value=depth=>{require(depth<=32,'json-depth');ws();const c=s[i];
  if(c==='"')return string();
  if(c==='{'){i++;const o={},seen=new Set();ws();if(s[i]==='}'){i++;return o}for(;;){ws();require(s[i]==='"','json-key');const k=string();require(!seen.has(k),'json-duplicate');seen.add(k);ws();require(s[i++]===':','json-colon');Object.defineProperty(o,k,{value:value(depth+1),enumerable:true});ws();const end=s[i++];if(end==='}')return o;require(end===',','json-object')}}
  if(c==='['){i++;const a=[];ws();if(s[i]===']'){i++;return a}for(;;){require(a.length<5000,'json-array-limit');a.push(value(depth+1));ws();const end=s[i++];if(end===']')return a;require(end===',','json-array')}}
  const m=/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(s.slice(i));require(m,'json-value');i+=m[0].length;const v=JSON.parse(m[0]);require(typeof v!=='number'||Number.isFinite(v),'json-number');return v;
 };const result=value(0);ws();require(i===s.length,'json-trailing');return result;
}
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return(crc^0xffffffff)>>>0}
export async function decodeQualificationZip(bytes,signal){
 require(bytes instanceof Uint8Array&&bytes.length>=98&&bytes.length<=262144,'zip-size');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u16=n=>v.getUint16(n,true),u32=n=>v.getUint32(n,true),end=bytes.length-22;
 require(u32(end)===0x06054b50&&u16(end+4)===0&&u16(end+6)===0&&u16(end+8)===1&&u16(end+10)===1&&u16(end+20)===0,'zip-directory');
 const cd=u32(end+16),cdSize=u32(end+12);require(cd>=30&&cd+cdSize===end&&cdSize>=46&&u32(cd)===0x02014b50,'zip-central');
 const flags=u16(cd+8),method=u16(cd+10),crc=u32(cd+16),compressed=u32(cd+20),size=u32(cd+24),nameLength=u16(cd+28),extraLength=u16(cd+30),comment=u16(cd+32);
 require((flags&~0x0808)===0&&[0,8].includes(method)&&size>0&&size<=65536&&compressed>0&&compressed<=262144,'zip-method-or-size');
 require(u16(cd+34)===0&&u32(cd+42)===0&&comment===0&&46+nameLength+extraLength===cdSize,'zip-layout');
 const mode=u32(cd+38)>>>16;require((mode&0xf000)!==0xa000&&(u32(cd+38)&0x10)===0,'zip-file-type');
 const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(cd+46,cd+46+nameLength));require(name==='qualification.json','zip-name');
 const extras=(start,length)=>{let p=start;while(p<start+length){require(p+4<=start+length,'zip-extra');const id=u16(p),n=u16(p+2);require(id!==1&&p+4+n<=start+length,'zip-extra');p+=4+n}};
 extras(cd+46+nameLength,extraLength);
 require(u32(0)===0x04034b50&&u16(6)===flags&&u16(8)===method&&u16(26)===nameLength,'zip-local');
 const localExtra=u16(28),start=30+nameLength+localExtra;require(start+compressed<=cd,'zip-overlap');
 require(bytes.subarray(30,30+nameLength).every((x,i)=>x===bytes[cd+46+i]),'zip-name-disagreement');extras(30+nameLength,localExtra);
 let dataEnd=start+compressed;
 if(flags&8){require([0,crc].includes(u32(14))&&[0,compressed].includes(u32(18))&&[0,size].includes(u32(22)),'zip-local-size');if(u32(dataEnd)===0x08074b50)dataEnd+=4;require(dataEnd+12===cd&&u32(dataEnd)===crc&&u32(dataEnd+4)===compressed&&u32(dataEnd+8)===size,'zip-descriptor')}
 else require(u32(14)===crc&&u32(18)===compressed&&u32(22)===size&&dataEnd===cd,'zip-local-size');
 const packed=bytes.subarray(start,start+compressed);let output;
 if(method===0){require(compressed===size,'zip-store-size');output=packed}
 else {
  // Bound compressed input chunks too: do not hand a highly expanding 256 KiB
  // block to native decompression before the expanded-size reader can cancel.
  let offset=0;const input=new ReadableStream({pull(controller){if(offset===packed.length){controller.close();return}const end=Math.min(offset+64,packed.length);controller.enqueue(packed.subarray(offset,end));offset=end}});
  output=await readBounded(input.pipeThrough(new DecompressionStream('deflate-raw')),size,signal);
 }
 require(output.length===size&&crc32(output)===crc,'zip-content');return{bytes:output,value:strictJSON(output)};
}
