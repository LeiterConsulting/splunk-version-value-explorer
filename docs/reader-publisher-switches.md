# Separate reader and authenticated activation switches

Both switches default disabled. Only the literal string `1` enables a switch.
`VC_ACTIVE_DELIVERY` retains its existing meaning: serve the database-aware loader
and use the verified same-engine publication head for unpinned content reads.
`VC_PUBLISHER_ACTIVATION` is a separate additional permission gate for the
authenticated `/api/publisher/activate` route, including maintenance rollback.

| Reader | Publisher activation | Behavior |
|---|---|---|
| off | off | Bundled reader; activation rejected |
| on | off | Database reader; activation rejected |
| off | on | Bundled reader; activation still rejected |
| on | on | Database reader; activation may proceed only through all existing authorization, exact evidence and CAS checks |

The new gate does not authorize anybody. Existing OIDC/maintenance authentication,
method/origin/body restrictions, repository/CI evidence, operation identity,
generation checks and append-only history remain unchanged. It does not change
the separately authenticated staging/bootstrap routes. Disabling activation is
not a guarantee of zero possible database initialization/staging writes.

The head API schema remains unchanged. `activeDelivery` reports the reader flag,
not activation permission. Existing held head-only observer deliberately expects
reader off; it is not a post-enable verifier. Workflow publication hold, disabled
workflow state and inactive caller remain separate and are not changed by code.

## Controlled rollout

This Worker change naturally changes the engine identity. Run ordered maintenance
generation, exact-candidate CI and export validation; deploy the exact new runtime
with both flags off; retain a matching reviewed deployed-seed record. Reconcile
the new engine channel and bootstrap only its exact seed through the existing
authorized process. Preserve all prior channels/events; no migration or deletion.

After independent live/head, hosted-reader and export qualification, enabling only
the reader is now possible while authenticated activation remains disabled.
Explicitly retain publisher flag `0`. Sites environment changes require deploying
the selected saved version before taking effect. Verify both settings and actual
runtime/source identity after deployment; settings saved alone are not activation.

Reader rollback sets only `VC_ACTIVE_DELIVERY=0` and redeploys the same saved
version. Preserve the publication head and history. Future publication activation
requires a separate approved decision, real authenticated transport and scheduler
qualification. Do not infer that approval from enabling the reader.
