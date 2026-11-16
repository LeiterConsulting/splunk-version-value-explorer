import hashlib,pathlib,tempfile,unittest,zipfile
import attestation_zip as m
class Tests(unittest.TestCase):
 def fixture(self,rows):
  d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);p=pathlib.Path(d.name)/'a.zip'
  with zipfile.ZipFile(p,'w') as z:
   for name,data in rows:z.writestr(name,data)
  return p
 def test_payload_mapping(self):
  p=self.fixture([('b',b'123'),('a',b'456')]);r,manifest=m.inspect(p)
  self.assertEqual(r['zipSha256'],hashlib.sha256(p.read_bytes()).hexdigest());self.assertEqual(r['payloadManifestSha256'],hashlib.sha256(manifest).hexdigest());self.assertEqual(r['fileCount'],2);self.assertEqual(r['admission'],'held');self.assertFalse(r['signatureVerified'])
 def test_unsafe_paths(self):
  for n in ['../x','/x','a//b','a/./b','a\\b','x\n']:
   with self.subTest(n=n),self.assertRaises(ValueError):m.inspect(self.fixture([(n,b'x')]))
 def test_duplicate(self):
  with self.assertRaises(ValueError):m.inspect(self.fixture([('a',b'a'),('a',b'b')]))
 def test_ancestor(self):
  with self.assertRaises(ValueError):m.inspect(self.fixture([('a',b'a'),('a/b',b'b')]))
 def test_symlink(self):
  i=zipfile.ZipInfo('link');i.create_system=3;i.external_attr=0o120777<<16
  with self.assertRaises(ValueError):m.inspect(self.fixture([(i,b'elsewhere')]))
 def test_member_budget(self):
  old=m.MAX_FILES;m.MAX_FILES=1
  try:
   with self.assertRaises(ValueError):m.inspect(self.fixture([('a',b'a'),('b',b'b')]))
  finally:m.MAX_FILES=old
 def test_expanded_budget(self):
  old=m.MAX_EXPANDED;m.MAX_EXPANDED=1
  try:
   with self.assertRaises(ValueError):m.inspect(self.fixture([('a',b'ab')]))
  finally:m.MAX_EXPANDED=old
 def test_manifest_order(self):
  _,a=m.inspect(self.fixture([('b',b'2'),('a',b'1')]));_,b=m.inspect(self.fixture([('a',b'1'),('b',b'2')]));self.assertEqual(a,b)
 def test_decompressor_rejected(self):
  d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);p=pathlib.Path(d.name)/'b.zip'
  with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_LZMA) as z:z.writestr('a',b'abc')
  with self.assertRaisesRegex(ValueError,'compression-method'):m.inspect(p)
 def test_central_directory_preflight(self):
  import struct
  p=self.fixture([('a',b'abc')]);b=bytearray(p.read_bytes());pos=b.rfind(b'PK\x05\x06');struct.pack_into('<L',b,pos+12,17*1024*1024);p.write_bytes(b)
  with self.assertRaisesRegex(ValueError,'central-directory-limit'):m.inspect(p)
 def test_zip64_locator_without_eocd_sentinels(self):
  import struct
  p=self.fixture([('a',b'abc')]);b=p.read_bytes();pos=b.rfind(b'PK\x05\x06')
  record=struct.pack('<4sQ2H2L4Q',b'PK\x06\x06',44,45,45,0,0,1,1,17*1024*1024,0)
  locator=struct.pack('<4sLQL',b'PK\x06\x07',0,pos,1)
  p.write_bytes(b[:pos]+record+locator+b[pos:])
  with self.assertRaisesRegex(ValueError,'zip64-held'):m.inspect(p)
  b=bytearray(p.read_bytes());e=b.rfind(b'PK\x05\x06');struct.pack_into('<H',b,e+20,65535);p.write_bytes(b+b'x'*65535)
  with self.assertRaisesRegex(ValueError,'zip64-held'):m.inspect(p)
if __name__=='__main__':unittest.main()
