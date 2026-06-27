# Course-Site

## Repos
- Main: `git@github.com:teacher-tsai/Course-Site.git`
- Content (private submodule): `git@github.com:teacher-tsai/course-content.git` → `course-content/`

## 每次開始前必做（CRITICAL）

**任何 read / write / commit / 其他操作之前，必須先執行以下確認，不可跳過：**

### 主 repo 確認
```bash
git branch          # 確認目前在哪個 branch
git status          # 確認有無未暫存的變更
git pull            # 拉最新，確保不落後 remote
```

### Submodule 確認（只要會碰到 course-content/ 就必做）
```bash
cd course-content
git branch          # 確認 submodule 的 current branch（不一定是 main！）
git status
git pull
cd ..
```

> **原則**：不確認 branch 就讀寫 = 改錯地方。不 pull 就 commit = 衝突風險。
> 兩個 repo（主 repo + submodule）各自獨立管理 branch，**每次都要分別確認**。

---

## Branch 規則

### 命名規範
- `feat/<name>` — 新功能
- `fix/<name>` — 修 bug
- `chore/<name>` — 設定、文件、非功能性變更

### 保護規則
- 禁止直接 push 到 `master`
- 禁止 force push 到 `master`
- 禁止刪除 `master`
- PR merge 到 `master` 前需要 `tested-on-dev` check 通過
- 所有改動必須從 feature branch 開始，**不可直接在 `dev` 或 `master` 上開發**
- Feature branch 必須從 `master` 開，不可從 `dev` 或其他 branch 開
- `dev` 可以直接 merge feature branch（不需要 PR），是測試用的 staging 環境
- `master` 只能透過 PR merge，不可直接 push

## Deploy & Test 流程

```
feature branch → dev（測試）→ feature branch PR → master
```

1. 從 `master` 開新的 feature branch（`feat/` / `fix/` / `chore/`）
2. 完成後 merge 進 `dev`（dev 是測試環境，可以亂）
3. 確認 https://teacher-tsai.github.io/Course-Site/dev/ 沒問題
4. 從 **feature branch** 開 PR 到 `master`
5. `tested-on-dev` check 自動確認這個 commit 曾在 `dev` 的歷史裡
6. Check 通過後 merge，自動部署到 https://teacher-tsai.github.io/Course-Site/

## GitHub Actions Jobs

| Job | 觸發 | Required | 用途 |
|-----|------|----------|------|
| `tested-on-dev` | PR → master | 是 | 確認 commit 已 merge 進 dev 測試過 |
| `submodule-check` | push (master/dev) + PR → master | 否 | 驗證 submodule 正常 |
| `test-on-dev` | dev push only | 否 | 標記此 commit 在 dev 上 |
| `deploy` | master push | 否 | 部署到根目錄 `/` |
| `deploy-dev` | dev push | 否 | 部署到 `/dev/` 子目錄 |

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

### Submodule 開發流程

主 repo 和 submodule 各有獨立的 branch，開發時兩邊都要 follow 相同的 feature branch 規則：

1. **submodule 先開 feature branch**（從 `main`）：
   ```bash
   cd course-content
   git checkout main && git pull
   git checkout -b feat/<name>
   ```
2. **主 repo 開對應的 feature branch**（從 `master`）：
   ```bash
   git checkout master && git pull
   git checkout -b feat/<name>
   ```
3. 在各自的 feature branch 上做修改並 commit
4. **Submodule commit 後，主 repo 要 commit submodule pointer 更新**（它們是兩個獨立的 commit）：
   ```bash
   # 在 submodule commit 後，回主 repo
   cd ..
   git add course-content
   git commit -m "chore: bump course-content submodule"
   ```
5. 兩個 feature branch 一起 merge 進各自的 `dev`，測試後再各開 PR 到 `master` / `main`

## Dev 預覽網址

- Production: https://teacher-tsai.github.io/Course-Site/
- Dev preview: https://teacher-tsai.github.io/Course-Site/dev/（需密碼）
- 密碼 gate: https://teacher-tsai.github.io/Course-Site/dev-gate/
