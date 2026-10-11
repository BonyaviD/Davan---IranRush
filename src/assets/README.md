Placeholder 3D scenery is built in code under `src/render/environment/` (one builder per world,
landmarks in `landmarks.ts`). To use real models later, load glTF files in those builders and
return them in place of the placeholder groups; game logic does not change.
`fonts/` holds Vazirmatn (OFL), served locally with no CDN.
