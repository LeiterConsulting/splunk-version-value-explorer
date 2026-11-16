"""Streaming byte/manifest qualification for an original export ZIP. No extraction/network."""
import hashlib,json,pathlib,stat,zipfile,struct,time
MAX_ZIP=2*1024**3
MAX_EXPANDED=4*1024**3
MAX_FILES=20000
def inspect(path):
    deadline=time.monotonic()+300
    def check():
        if time.monotonic()>deadline: raise ValueError('inspection-deadline')
    p=pathlib.Path(path)
    if not p.is_file() or not 0<p.stat().st_size<=MAX_ZIP: raise ValueError('archive-size')
    outer=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): check();outer.update(b)
    # Bound central directory allocation BEFORE ZipFile loads it. ZIP64 is held
    # in this initial <2GiB/<20k-file policy rather than guessed from sentinels.
    with p.open('rb') as f:
        f.seek(max(0,p.stat().st_size-65577));tail=f.read(65577)
    pos=tail.rfind(b'PK\x05\x06')
    if pos<0 or len(tail)-pos<22: raise ValueError('missing-eocd')
    if pos>=20 and tail[pos-20:pos-16]==b'PK\x06\x07': raise ValueError('zip64-held')
    sig,disk,cd_disk,disk_count,count,cd_size,cd_offset,comment=struct.unpack('<4s4H2LH',tail[pos:pos+22])
    if disk or cd_disk or disk_count!=count or count>MAX_FILES or count==65535 or cd_size>16*1024*1024 or cd_size==0xffffffff or cd_offset==0xffffffff or cd_offset+cd_size>p.stat().st_size or pos+22+comment!=len(tail): raise ValueError('central-directory-limit')
    rows=[];seen=set();total=0
    with zipfile.ZipFile(p) as z:
        entries=z.infolist()
        if len(entries)>MAX_FILES: raise ValueError('entry-limit')
        for i in entries:
            check()
            if i.compress_type not in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED): raise ValueError('compression-method')
            name=i.filename
            if name!=i.orig_filename: raise ValueError('path-normalization')
            parts=name.split('/')
            if not name or name.startswith('/') or '\\' in name or any(x in ('','.','..') for x in parts) or any(ord(c)<32 for c in name) or name in seen: raise ValueError('unsafe-path')
            seen.add(name)
            mode=i.external_attr>>16
            if i.is_dir() or stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0,stat.S_IFREG)): raise ValueError('unsupported-entry')
            if i.flag_bits&1: raise ValueError('encrypted-entry')
            total+=i.file_size
            if total>MAX_EXPANDED: raise ValueError('expanded-limit')
            h=hashlib.sha256();actual=0
            with z.open(i) as f:
                for b in iter(lambda:f.read(1024*1024),b''):
                    check();actual+=len(b)
                    if actual>i.file_size: raise ValueError('member-size')
                    h.update(b)
            if actual!=i.file_size: raise ValueError('member-size')
            rows.append({'path':name,'size':actual,'sha256':h.hexdigest()})
    # Ancestor-file aliases are rejected even though no files are extracted here.
    for name in seen:
        parts=name.split('/')
        if any('/'.join(parts[:n]) in seen for n in range(1,len(parts))): raise ValueError('path-conflict')
    rows.sort(key=lambda x:x['path'].encode('utf-8'))
    manifest=json.dumps({'schemaVersion':1,'files':rows},ensure_ascii=False,separators=(',',':')).encode('utf-8')
    return {'schemaVersion':1,'zipSha256':outer.hexdigest(),'zipBytes':p.stat().st_size,'payloadManifestSha256':hashlib.sha256(manifest).hexdigest(),'fileCount':len(rows),'expandedBytes':total,'signatureVerified':False,'admission':'held'},manifest
if __name__=='__main__':
    import sys
    receipt,manifest=inspect(sys.argv[1])
    pathlib.Path(sys.argv[2]).write_bytes(manifest)
    print(json.dumps(receipt,indent=2))
