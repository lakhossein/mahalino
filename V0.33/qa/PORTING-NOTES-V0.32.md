# V0.32 technical refactor

Source: V0.31 at main commit 353b8de20902f1f64977f022c8aff8bd2557354c.
The complete V0.31 tree remains unchanged.

Runtime assets and research are copied from V0.31. Runtime source is extracted
from its built artifact, preserving script scope, load order, whitespace, event
registration, styles, data, public APIs and existing journeys. Source modules
contain their final display terminology, so build-time text rewriting is gone.

The standalone build reads templates/, src/, build/ and build-manifest.json.
It does not use an older HTML template or files outside V0.32.
The cross-version parity test alone reads ../V0.31 as its regression oracle;
that test is a repository QA requirement, not a build/runtime dependency.

State uses mahalino_v32; an absent state can import mahalino_v31 before older
fallbacks. V0.31 is never written. Existing V0.32 data takes priority.
