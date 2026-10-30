# Public issue feed 1.0.0

**Native producer enabled.** [Publication policy](producer-policy.json) and
[reviewer guide](../../../docs/issue-feed-native.md) make the feed a required
output of the existing independent review watches. Coverage remains bounded;
activation alone does not add assessments or advance the issue checkpoint.

A read-only publication supporting discovery and assessment of issues identified
by VersionCompass. Start with the [definition and consumer guide](../../../docs/issue-feed.md),
[index](index.json) and [JSON Schema](schema.json).

Resolve one full repository commit and read every object at that commit. Verify
descriptor hashes and byte lengths before intake. The current bounded coverage has
twelve real concerns and twenty-three historical assessments. Checkpoint three
extends the original two-finding/four-assessment pilot while retaining both bootstrap
checkpoints. See the [coverage register](../../../docs/issue-feed-coverage.md).
This is not an exhaustive export or a fresh source review.

[Synthetic examples](examples/index.json) are a separate stream and must never be
treated as product findings. Neither disappearance nor a publication/status label
alone establishes a correction. There is no designated website endpoint for this feed.
