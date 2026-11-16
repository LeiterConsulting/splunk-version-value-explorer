# Isolated export attestation: draft commissioning procedure

This change adds signing evidence, not production admission or publishing. Owner approval covers preparing/testing the isolated main-push signer's `id-token: write` and `attestations: write` authority. It does not authorize merge, workflow enablement, deployment, production D1 access or activation.

## Implemented boundary

- Existing validation remains push/PR with explicit contents-read permission. New signer needs successful validation and is restricted to same-repository main push, attempt 1. It has contents/actions read plus the two explicitly approved signing permissions. No PR signing or reusable/cross-workflow privilege bridge.
- A fresh runner retrieves the original artifact by ID, verifies fixed-source run/attempt/jobs/repository/head/digest and streams the original ZIP. It does not execute artifact contents, install dependencies or restore caches. The signer trusts exact reviewed main workflow/source; a compromised authorized workflow can still issue false claims.
- Signed subject is the original ZIP digest. Custom predicate binds immutable artifact ID, source/tree/workflow SHA, run/attempt, validation job and complete canonical payload-manifest digest. It is not retroactive proof for earlier unsigned artifacts.
- Signer action is pinned to actions/attest v4.2.2 commit 1e69f48acb82d1966a394da916b4c1698aa569d6. Registry push/storage creation are off; no artifact-metadata permission.
- ZIP processing limits: 2 GiB archive, 4 GiB expansion, 20,000 entries, 16 MiB central directory, stored/deflate only, ZIP64 held, no traversal/duplicates/symlinks/ancestor aliases. Streaming chunks are 1 MiB. Preparation has 768 MiB address-space, 300-second CPU, 540-second acquisition deadline and outer 600-second timeout.
- Verifier executes a hash-pinned official CLI with a hash-pinned TUF-acquired root snapshot, no inherited credentials, bounded subprocess output/time, and certificate identity/run-attempt checks. Predicate values alone do not substitute for issuer certificate identity. Trust-root review deadline is explicit; expiration holds, never silently refreshes.

## Local validation

Run from repository root:

```
PYTHONPATH=scripts python3 -m unittest discover -s tests -p 'test_*attestation*.py'
node scripts/maintenance.cjs --verify
```

The streaming inspector was separately exercised against the actual original main export ZIP: 457,692,555 bytes, 4,631 files, 569,778,893 expanded bytes, ZIP SHA256 765a622916a8d102542bc6a33bd5935d05588cd867807c06e82c52d58294abcc. Recomputed canonical manifest SHA256: 4722e5f25a50bec667ba7608f2fdba9e4af8aa3c4d0f857efc23d914a31a9464. These are byte-scale tests, not successful signature qualification.

Independent review identified central-directory allocation and ZIP64 locator bypasses; both were fixed and regression-tested, including maximal ZIP comments. Negative tests cover PR/non-main/rerun contexts, artifact/run mismatch, storage redirect auth stripping, second redirects, truncated bodies and archive safety. Mock certificate tests are not real signed executions.

## Fresh qualification, still required

1. Review exact diff and obtain any required main integration authorization. Do not bypass denied merge/enable actions. A draft PR/branch cannot sign; no dispatch workaround exists.
2. Once legitimately integrated, a new main push must pass full original validation and the signer. A rerun is deliberately rejected. Compare fresh run/attempt/source, original artifact and job records, then download the ORIGINAL export ZIP and separate bundle.
3. Using the pinned verifier and root asset, verify the original ZIP/bundle against independently assembled expected context. Confirm actual certificate fields match reviewed pinned-CLI semantics, especially immutable repository/owner IDs, main-push trigger and RunInvocationURI ending in the exact run/attempt. Missing/unexpected fields hold.
4. Independently regenerate payload manifest and run full export semantic verification. Negative tests with altered ZIP and altered bundle/predicate must fail. Confirm PR, non-main and rerun signer guards in real service behavior where safely supported.
5. Retain result separately as signature/upload-attempt evidence. Durable admission/history, current runtime/env/head, stop/recovery, rollback and production authorization remain separate. All results remain admission held and productionActionAllowed false.

Publisher workflow stays disabled. OIDC=1, active delivery=0 and publisher activation=0 remain unchanged. No database route or production mutation is introduced.
