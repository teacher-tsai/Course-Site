# course-content

Private submodule of `teacher-tsai/Course-Site`. 存放課程網站的多語言內容與設定檔。

## Repos
- Main repo: `git@github.com:teacher-tsai/Course-Site.git`
- 本 repo: `git@github.com:teacher-tsai/course-content.git`

## 結構

```
course-content/
├── en.json        # 英文內容
├── zh.json        # 繁體中文內容
└── config.json    # 網站設定（API endpoints 等）
```

## Branch 規則

### 命名規範
- `feat/<name>` — 新功能或新內容
- `fix/<name>` — 修正錯誤
- `chore/<name>` — 設定、結構調整

### 保護規則
- 禁止直接 push 到 `main`
- 所有改動必須從 feature branch 開始，**不可直接在 `dev` 或 `main` 上開發**
- Feature branch 必須從 `main` 開，不可從 `dev` 或其他 branch 開
- `dev` 可以直接 merge feature branch（不需要 PR）
- `main` 只能透過 PR merge

## 開發流程

```
feature branch → dev（預覽）→ feature branch PR → main
```

1. 從 `main` 開新的 feature branch
2. 完成後 merge 進 `dev`
3. 確認 Course-Site 的 dev 預覽網站（https://teacher-tsai.github.io/Course-Site/dev/）沒問題
4. 從 **feature branch** 開 PR 到 `main`
5. Merge 後，在 Course-Site 更新 submodule pointer

## 與 Course-Site 的關係

- Course-Site 的 `pr-check.yml` 會驗證 submodule 必須指向本 repo `main` 的最新 commit
- 內容改動流程：
  1. 在本 repo 開 feature branch、改內容
  2. Merge 進本 repo 的 `dev` → Course-Site dev 預覽會讀到更新（需要 Course-Site 也更新 submodule pointer）
  3. PR 進本 repo 的 `main`
  4. 在 Course-Site 跑 `git submodule update --remote` 並 commit submodule pointer 更新

## config.json 格式

```json
{
  "gasUrl": "https://script.google.com/macros/s/.../exec"
}
```

`gasUrl` 為課程預約系統的 Google Apps Script Web App URL，不可公開。
