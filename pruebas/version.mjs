// Nivel de release para las regresiones por RC: `1.0.0-rc.N` → N; la versión final
// `1.0.0` (o cualquier x.y.z sin prerelease ≥ 1.0.0) cuenta como posterior a todo RC.
export function nivelRc(version) {
  const v = String(version || '');
  const rc = /^1\.0\.0-rc\.(\d+)(?:\.\d+)?$/.exec(v);
  if (rc) return Number(rc[1]);
  const final = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (final && Number(final[1]) >= 1) return Infinity;
  return -1;
}
