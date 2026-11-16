# Inactive D1 journal storage adapter

This is a capability qualification slice, not a publisher or operational service.
No production schema migration, Worker route, workflow, secret, permission, or
activation is added. The module is outside the production Worker build. It statically imports the portable semantic replay validator, with differential
tests against the existing reviewed local replay. Callers cannot replace it. No flag in supplied JSON grants authentication or release authority.

## Actual D1 API path

The adapter uses `withSession('first-primary')` for sequential read/write readback.
It reads and hashes the bounded chain, validates transitions, then appends with a
single `INSERT ... SELECT ... WHERE` statement checking sequence and expected
tail in the database. A stale observation cannot become an unconditional write.
The schema scopes sequence and digest uniqueness by project. No lease expiry,
unlock, retry or remote publication is implemented. A thrown write call is unknown;
a zero-change conditional write is a conflict; a missing readback is unverified.

Cloudflare documents prepared statements, transactional batch rollback and
sequentially consistent sessions at:
https://developers.cloudflare.com/d1/worker-api/d1-database/

The adapter only needs one statement per append, avoiding JavaScript-interleaved
transactions unsupported by a D1 binding. Successful CAS only fences cooperating
journal writers, not Sites or existing publication mutations. This is not a lock
around the live site. The reference schema is deliberately outside active
`drizzle` migrations.

## Qualification and limitations

Normal Node tests cover contract failures with synthetic bindings. Separately,
`qualify-d1-journal.cjs` exercises the actual D1 binding in official Miniflare,
including a concurrent single-winner append, wrong-project/stale inputs, sticky
denial, runtime restart, a real committed write followed by an injected transport
failure, tampered-chain rejection, and execution of portable replay and a journal append inside actual local
workerd. Eleven additional differential cases cover valid and invalid transitions. Synthetic binding tests are not emulator
checks; emulator checks are not remote production verification.

Use an isolated scratch installation of pinned `miniflare@4.20260730.0`, then run:

    NODE_PATH=/absolute/path/to/scratch/node_modules node tools/release-coordination/qualify-d1-journal.cjs

The harness creates temporary local storage and removes only its own fixture.
The production repository dependency set is unchanged. The experiment's explicit
output keeps productionD1Verified, authenticationVerified, remoteFencing and
productionActionAllowed false. It does not claim cross-region consistency testing,
power-loss guarantees or production privilege isolation.

A deployable adapter still requires a supported isolated hosted test, authenticated
request admission, bounded schema
migration approval, and independent full live readback. Existing denied operations
must not be retried or bypassed to supply these capabilities. Current bundled
service and publication holds remain unchanged.
