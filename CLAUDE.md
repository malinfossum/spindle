# Spindle — session rules

Read this before committing anything in this repo, in whatever environment you run.

## Commit identity — non-negotiable

Every commit is authored and committed by me, and only me:

```
git config user.name "Malin Fossum"
git config user.email "malinfossum.dev@proton.me"
```

Run those two lines before the first commit if `git config user.email` prints anything
else. Cloud and remote sessions arrive with their own git identity, and one commit under it
puts a stranger in this repo's contributor list for good — GitHub caches that list and a
history rewrite does not clear it. After committing, confirm with
`git log -1 --format='%an <%ae> | %cn <%ce>'`; if either side is not me, fix it with
`git commit --amend --reset-author` before pushing.

No attribution trailers, ever: no `Co-Authored-By`, no `Claude-Session`, no
"Generated with" line — in commits, PR titles or PR bodies. The check in
`.github/workflows/commit-identity.yml` rejects any pull request that breaks either rule,
and `main` requires it to pass.

## Voice and format

Commit subjects are plain sentence case, not conventional commits. Everything written in
this repo — code comments, docs, plans, PR text — is in my first-person voice. The specs of
record are `docs/v0.*-plan.md`; read the current one before building anything.
