# Synthetic compatibility fixture

`itsi-schema2-before-runtime.json` was authored as a synthetic ITSI dependency
test during development. It contains one generic statement, three numeric
criteria and artificial edit history from schema version 2 before the optional
runtime field. It is not a customer brief, vendor-document decomposition or
assessment of an actual installation. The captured generated report has been
removed (`built: null`); tests build fresh results from the current engine.

The existing audit chain is retained to test import integrity and acceptance
reset. Its hashes prove internal consistency, not authorship or source trust.
This file is test input only and is not embedded in the visitor workflow.

The separate eight-criterion fixture under `tools/export-verification` is also
synthetic and used only by rendered export tests. Private trials, source PDFs,
customer imports and their histories are excluded from this package.
