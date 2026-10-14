# SPDX-License-Identifier: Apache-2.0
"""Explicit one-time, free public download; no startup network fallback."""
from pathlib import Path
import hashlib, urllib.request, json, time
dest=Path(__file__).resolve().parent.parent/'.local-ai'
dest.mkdir(exist_ok=True)
revision='248ec68a63e219e3f061e4c946fc8a20d63b9975'
filename='apertus-v1.5-8b-text-q4_k_m.gguf'
expected='a037df8d87ff6caacee794ee85f55342f2152e0d359b7389033300c3bee5f299'
target=dest/filename
if target.exists():
    with target.open('rb') as f: digest=hashlib.file_digest(f,'sha256').hexdigest()
    if digest!=expected: raise RuntimeError('Existing model hash differs. No overwrite performed.')
else:
    partial=dest/(filename+'.part')
    if partial.exists(): raise RuntimeError('Partial download exists. Inspect before resuming.')
    url=f'https://huggingface.co/Colby/apertus-v1.5-8b-text-Q4_K_M-GGUF/resolve/{revision}/{filename}'
    h=hashlib.sha256();size=0;notice=time.monotonic()
    print('Downloading 5.06 GB of public Apertus weights (Apache-2.0).',flush=True)
    with urllib.request.urlopen(url,timeout=90) as response,partial.open('wb') as out:
        while chunk:=response.read(4*1024*1024):
            out.write(chunk);h.update(chunk);size+=len(chunk)
            if time.monotonic()-notice>20:
                print(f'{size/1e9:.2f} / 5.06 GB',flush=True);notice=time.monotonic()
    if size!=5059027136 or h.hexdigest()!=expected: raise RuntimeError('Model integrity check failed.')
    partial.rename(target)
(dest/'provenance.json').write_text(json.dumps({'repository':'Colby/apertus-v1.5-8b-text-Q4_K_M-GGUF','revision':revision,'file':filename,'bytes':5059027136,'sha256':expected,'license':'Apache-2.0','downloadVerified':True},indent=2)+'\n')
print('Apertus SHA256 verified.')
