"""Inactive reference qualification under workerd's expression-depth ceiling."""
import hashlib, pathlib, re, sqlite3, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / 'tools/release-coordination'
publication = subprocess.check_output(['node', '--input-type=module', '-e', "import {PUBLICATION_SCHEMA} from './worker/publication-core.mjs'; process.stdout.write(PUBLICATION_SCHEMA)"], cwd=ROOT, text=True)
seal = (DIR / 'admission-seal-reference.sql').read_text()
# Remove only added grouping around pure comparison conjunctions, preserving
# every leaf, its order, and all pre-existing nested head/provenance expressions.
pattern = r' WHERE (\(+a\.operation_id IS [^\n]+?a\.stopped=0\)+)'
chains = re.findall(pattern, seal)
assert len(chains) == 6
for chain in chains:
    assert all(re.fullmatch(r"(?:a|d|s|NEW)\.[a-z_0-9]+(?: IS |=)(?:(?:b|NEW)\.[a-z_0-9]+|'preparing'|'admitted'|0)", leaf) for leaf in chain.replace('(', '').replace(')', '').split(' AND '))
unbalanced = re.sub(pattern, lambda m: ' WHERE ' + m[1].replace('(', '').replace(')', '') + ')' * (m[1].count(')') - m[1].count('(')), seal)

assert hashlib.sha256(unbalanced.encode()).hexdigest() == '5ca8a71be722b6fc8b5d04c2f2a87fce08b8c13890596df1b13539be89a28bbf', 'predicate or other source changed from reviewed b181 source'

def exercise(schema):
    db = sqlite3.connect(':memory:')
    db.setlimit(sqlite3.SQLITE_LIMIT_EXPR_DEPTH, 100)
    assert db.getlimit(sqlite3.SQLITE_LIMIT_EXPR_DEPTH) == 100
    db.executescript('''PRAGMA foreign_keys=ON;
CREATE TABLE content_revisions(id TEXT PRIMARY KEY,engine TEXT NOT NULL,schema_version INTEGER NOT NULL,digest TEXT NOT NULL,manifest_json TEXT NOT NULL,bundle_json TEXT NOT NULL,record_count INTEGER NOT NULL,completed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE content_records(revision_id TEXT NOT NULL REFERENCES content_revisions(id),record_id TEXT NOT NULL,kind TEXT NOT NULL,dataset TEXT NOT NULL,payload_json TEXT NOT NULL,PRIMARY KEY(revision_id,record_id));
CREATE TABLE content_publication(channel TEXT PRIMARY KEY,revision_id TEXT NOT NULL REFERENCES content_revisions(id));''')
    db.executescript(publication)
    for name in ['database-fence-reference.sql', 'admission-history-reference.sql']:
        db.executescript((DIR / name).read_text())
    db.executescript(schema)
    engine='engine-'+'a'*20; channel='engine:'+engine; op='pub-'+'9'*32
    target='content-'+'d'*24; digest='c'*64; commit='b'*40; hashes=[x*64 for x in '1234']
    a=[channel,op,'owner-a',1,target,digest,commit,None,0,'bootstrap','preparing',0]
    db.execute('INSERT INTO release_admission VALUES('+','.join('?'*12)+')',a)
    db.execute("INSERT INTO content_revisions VALUES(?,?,1,?,'{}','{}',0,0,?,?,?)",[target,engine,digest,op,'owner-a',1])
    db.execute("INSERT INTO content_publication_provenance VALUES(?,?,?,1,'synthetic',?,?,?)",[target,'LeiterConsulting/splunk-version-value-explorer',commit,op,'owner-a',1])
    db.execute('UPDATE content_revisions SET completed=1 WHERE id=?',[target])
    db.execute('INSERT INTO release_admission_bindings VALUES('+','.join('?'*14)+')',[op,channel,'owner-a',1,target,digest,commit,None,0,'bootstrap',*hashes])
    try:
        db.execute("UPDATE release_admission SET state='admitted'")
    except sqlite3.DatabaseError as e:
        if 'admission-seal-required' not in str(e): raise
    else: raise AssertionError('unsealed transition accepted')
    db.execute('INSERT INTO release_admission_seals VALUES('+','.join('?'*7)+')',[op,'owner-a',1,*hashes])
    assert db.execute('SELECT state FROM release_admission').fetchone()[0]=='admitted'
    db.execute("INSERT INTO content_publication_events VALUES(?,?,1,?,?,?,'publish','synthetic',?,?,1)",[op,channel,target,target,commit,op,'owner-a'])
    assert db.execute('SELECT state FROM release_admission').fetchone()[0]=='consumed'
    assert db.execute('SELECT revision_id FROM content_publication').fetchone()[0]==target
    db.close()
try:
    exercise(unbalanced)
except sqlite3.OperationalError as e:
    assert 'Expression tree is too large' in str(e), str(e)
else:
    raise AssertionError('negative control did not reproduce depth failure')
exercise(seal)
print('Depth100: original negative control fails; balanced seal/bootstrap/consume passes.')
