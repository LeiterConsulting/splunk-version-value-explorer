"""Local reference store only. Not a D1 adapter, remote lock, or authority service."""
import json, sqlite3, sys, os

def run(filename, request):
    if os.path.islink(filename):
        raise ValueError('symlink-store')
    db = sqlite3.connect(filename, timeout=5, isolation_level=None)
    try:
        db.execute('PRAGMA synchronous=FULL')
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('BEGIN IMMEDIATE')
        db.execute('CREATE TABLE IF NOT EXISTS journal (sequence INTEGER PRIMARY KEY CHECK(sequence>0), previous_hash TEXT, event_hash TEXT NOT NULL UNIQUE, record_json TEXT NOT NULL)')
        rows = db.execute('SELECT sequence, previous_hash, event_hash, record_json FROM journal ORDER BY sequence').fetchall()
        if len(rows)>500: raise ValueError('journal-limit')
        records = [json.loads(r[3]) for r in rows]
        for row, record in zip(rows,records):
            if row[0]!=record['sequence'] or row[1]!=record['previousSha256'] or row[2]!=record['sha256']:
                raise ValueError('projection-mismatch')
        if request['action']=='read':
            db.execute('COMMIT')
            return records
        if request['action']!='append': raise ValueError('unsupported-action')
        record=request['record']
        tail=rows[-1][2] if rows else None
        if tail!=request['expectedTail'] or record['previousSha256']!=tail or record['sequence']!=len(rows)+1:
            raise ValueError('journal-tail-moved')
        output=json.dumps(record,separators=(',',':'),ensure_ascii=False)
        if len(rows)>=500 or len(output.encode())>16384 or sum(len(r[3].encode())+1 for r in rows)+len(output.encode())+1>1048576:
            raise ValueError('journal-limit')
        db.execute('INSERT INTO journal VALUES (?,?,?,?)',(record['sequence'],tail,record['sha256'],output))
        db.execute('COMMIT')
        return {'committed':True,'tail':record['sha256']}
    except BaseException:
        if db.in_transaction: db.execute('ROLLBACK')
        raise
    finally:
        db.close()

if __name__=='__main__':
    try:
        data=sys.stdin.buffer.read(32769)
        if len(data)>32768: raise ValueError('request-limit')
        print(json.dumps(run(sys.argv[1],json.loads(data))))
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
