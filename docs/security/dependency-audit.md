# Dependency security audit

**Last verified:** 2026-10-23

## Open development-tool advisory

The complete `npm audit` report records five High-severity package entries, but all five are dependency-path effects of the same advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affecting `braces <= 3.0.3` (stack-exhaustion denial of service).

The current path in the lockfile is:

- `eslint-config-next@16.4.2`
- `@next/eslint-plugin-next@16.4.2`
- `fast-glob@3.3.1`
- `micromatch@4.0.8`
- `braces@3.0.3`

As of the verification date, the advisory lists **no patched `braces` release**. npm's suggested automatic remediation downgrades `eslint-config-next` to `14.2.35` as a SemVer-major change, which is not an acceptable automatic downgrade for this Next.js 16 application. Do not claim this advisory is fixed or force an override to a nonexistent `braces@3.0.4` release.

The finding is in the development/lint toolchain, not the production dependency tree. CI now runs `npm audit --omit=dev --audit-level=high` as a blocking production-dependency security check. The full audit JSON remains available as a workflow artifact for follow-up.

## Re-evaluation criteria

Recheck this item when either:
1. `braces` publishes a patched version and the compatible dependency graph can resolve it; or
2. `@next/eslint-plugin-next` replaces the vulnerable `fast-glob` → `micromatch` → `braces` chain.

Until then, keep the production audit gate enabled, preserve the full audit report, and avoid indiscriminate upgrades or downgrades.
