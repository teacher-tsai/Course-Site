# Course-Site

## Repos
- Main: `git@github.com:teacher-tsai/Course-Site.git`
- Content (private submodule): `git@github.com:teacher-tsai/course-content.git` → `course-content/`

## Branch 規則

### 命名規範
- `feat/<name>` — 新功能
- `fix/<name>` — 修 bug
- `chore/<name>` — 設定、文件、非功能性變更

### 保護規則
- 禁止直接 push 到 `master`
- 禁止 force push 到 `master`
- 禁止刪除 `master`
- Merge 到 `master` 前需要 `deploy-dev` check 通過

## Deploy & Test 流程

```
feature branch → dev → master
```

1. 從 `master` 開新的 feature branch（`feat/` / `fix/` / `chore/`）
2. 完成後 merge 進 `dev`
3. `dev` 自動部署到 https://teacher-tsai.github.io/Course-Site/dev/（密碼保護）
4. 在 dev 環境確認沒問題後，從 `dev` 開 PR 到 `master`
5. `deploy-dev` check 通過後才能 merge
6. Merge 後自動部署到 https://teacher-tsai.github.io/Course-Site/

## GitHub Actions Jobs

| Job | 觸發 | 用途 |
|-----|------|------|
| `submodule-check` | master / dev push | 驗證 submodule 正常（非 required） |
| `test-on-dev` | dev push only | 確認 commit 曾過 dev branch（非 required） |
| `deploy` | master push | 部署到根目錄 `/` |
| `deploy-dev` | dev push | 部署到 `/dev/` 子目錄 |

## Submodule

Clone 時需帶入 submodule：
```bash
git clone --recurse-submodules git@github.com:teacher-tsai/Course-Site.git
```

已 clone 但沒有 submodule 時：
```bash
git submodule update --init
```

更新 submodule 到最新：
```bash
git submodule update --remote
```

`course-content` 為 private repo，GitHub Actions 透過 `SUBMODULE_DEPLOY_KEY` secret 存取。

## Dev 預覽網址

- Production: https://teacher-tsai.github.io/Course-Site/
- Dev preview: https://teacher-tsai.github.io/Course-Site/dev/（需密碼）
- 密碼 gate: https://teacher-tsai.github.io/Course-Site/dev-gate/
