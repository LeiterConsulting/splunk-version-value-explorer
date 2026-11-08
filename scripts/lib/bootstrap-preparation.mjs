/* Offline preparation only. No credential acquisition, publisher adapter or network.
 * Local Git identity and supplied head evidence are not hosted provenance proof. */
import { execFileSync } from 'node:child_process';
import { validateBundle, REPOSITORY } from '../../worker/publication-core.mjs';
import { operationId } from './publication-orchestration.mjs';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$(?![\s\S])/.test(value);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === keys;
const fail = reason => { throw Object.assign(Error(reason), { reason }); };
export async function prepareSeedBootstrap({ repositoryPath, callerCommit, mechanism, expectedSeed, head } = {}) {
  const base = { status: 'blocked', claimedDelivered: false, productionAuthorized: false,
    qualification: 'Offline preparation only. Supplied head is not current hosted state; runtime authentication, exact committed bytes and successful main CI remain required.' };
  try {
    const pin = structuredClone(expectedSeed), observed = structuredClone(head);
    if (!exact(pin, 'digest,engineRevision,recordCount,revision,sourceCommit,sourceTree') || !sha(callerCommit) || !sha(pin?.sourceCommit) || !sha(pin?.sourceTree) || !['github-oidc', 'administrative'].includes(mechanism)) fail('invalid-context');
    // Explicit local Git object reads only. Never checkout/run historical code,
    // fetch a ref, acquire credentials or contact a remote.
    const git = (...args) => execFileSync('git', ['--no-replace-objects', '-c', 'protocol.allow=never', '-C', repositoryPath, ...args], { env: { PATH: process.env.PATH, GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' }, timeout: 10000, encoding: 'utf8', maxBuffer: 9 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    if (git('rev-parse', '--verify', `${callerCommit}^{commit}`).trim() !== callerCommit ||
        git('rev-parse', '--verify', `${pin.sourceCommit}^{commit}`).trim() !== pin.sourceCommit ||
        git('rev-parse', '--verify', `${pin.sourceCommit}^{tree}`).trim() !== pin.sourceTree) fail('source-binding-mismatch');
    const bundle = JSON.parse(git('show', `${pin.sourceCommit}:dist/content-bundle.json`));
    const manifest = JSON.parse(git('show', `${pin.sourceCommit}:content/publication.json`));
    if (JSON.stringify(manifest) !== JSON.stringify(bundle.manifest) ||
        ['revision', 'engineRevision', 'digest', 'recordCount'].some(key => manifest[key] !== pin[key])) fail('seed-binding-mismatch');
    await validateBundle(bundle, pin.engineRevision);
    const identities = { callerCommit, candidateCommit: pin.sourceCommit, sourceTree: pin.sourceTree,
      revision: manifest.revision, engineRevision: manifest.engineRevision, digest: manifest.digest, recordCount: manifest.recordCount };
    if (mechanism === 'github-oidc' && callerCommit !== pin.sourceCommit) return { ...base, ...identities, reason: 'oidc-candidate-commit-mismatch', requiredMechanism: 'administrative' };
    // Absence is not generation zero. Do not turn missing/failed observation into
    // authorization to seed. Positive MAX generation is not provenance proof.
    if (!exact(observed, 'activeDelivery,engineRevision,generation,revision') ||
        observed.engineRevision !== manifest.engineRevision || observed.activeDelivery !== false ||
        !Number.isSafeInteger(observed.generation) || observed.generation < 0) fail('head-unverified');
    if (observed.revision !== manifest.revision) fail('head-conflict');
    if (observed.generation !== 0) return { ...base, ...identities, reason: 'history-already-present-reconcile' };
    return { ...base, ...identities, status: 'prepared-not-authorized', mechanism,
      request: { candidate: { repository: REPOSITORY, commit: pin.sourceCommit, bundle }, operationId: operationId(pin.sourceCommit, 'bootstrap') },
      nextStep: 'Separate approval for existing administrative credential use (if selected), exact seed bootstrap and readback. No automatic submission or retry.' };
  } catch (error) {
    const reasons = ['invalid-context', 'source-binding-mismatch', 'seed-binding-mismatch', 'head-unverified', 'head-conflict'];
    return { ...base, reason: reasons.includes(error?.reason) ? error.reason : 'local-validation-failed' };
  }
}
