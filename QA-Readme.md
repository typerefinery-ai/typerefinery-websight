# QA Readme — How to Test Items Marked **In Review**

This guide shows developers exactly how to set up repositories, pull the latest code, start the local stack, deploy the latest updates, and verify the changes.

---

## 1) Prerequisites

- Windows PowerShell
- Git with access to the Typerefinery GitHub repos
- No uncommitted changes (stash or commit before pulling)
- Cloned repositories with correct remotes

---

## 2) Repository Setup (first-time only)

Clone the repositories into `C:\projects\typerefinery-ai\`:

```powershell
# A) typerefinery-websight
git clone https://github.com/typerefinery-ai/typerefinery-websight.git

# B) widget-graph-viz
git clone https://github.com/typerefinery-ai/widget-graph-viz.git

# C) typerefinery
git clone https://github.com/typerefinery-ai/typerefinery.git
```

Verify the remotes:

```powershell
cd typerefinery-websight
git remote -v
# origin  https://github.com/typerefinery-ai/typerefinery-websight.git

cd ..\widget-graph-viz
git remote -v
# origin  https://github.com/typerefinery-ai/widget-graph-viz.git

cd ..\typerefinery
git remote -v
# origin  https://github.com/typerefinery-ai/typerefinery.git
```

---

## 3) Sync all repositories

> Run each block in its repo folder.

### A) `typerefinery-websight` (use **develop**)
```powershell
cd C:\projects\typerefinery-ai\typerefinery-websight
git fetch origin
git checkout develop
git pull --rebase origin develop
git submodule update --init --recursive
```

### B) `widget-graph-viz` (use **main**)
```powershell
cd C:\projects\typerefinery-ai\widget-graph-viz
git fetch origin
git checkout main
git pull --rebase origin main
git submodule update --init --recursive
```

### C) `typerefinery` (use **master**)
```powershell
cd C:\projects\typerefinery-ai\typerefinery
git fetch origin
git checkout master
git pull --rebase origin master
git submodule update --init --recursive
```

---

## 4) Start core services

> Start these **before** deploying apps/content.

### A) Start Typerefinery
```powershell
cd C:\projects\typerefinery-ai\typerefinery
.\start.ps1
```

### B) Start Graph Viz
```powershell
cd C:\projects\typerefinery-ai\widget-graph-viz
.\start.ps1
```

**Health endpoint:**  
http://localhost:3001/services

Wait until services show as **running/healthy**.

---

## 5) Deploy latest apps & content tests

> From the `typerefinery-websight` repo:

```powershell
cd C:\projects\typerefinery-ai\typerefinery-websight
.\deploy-app.ps1
.\deploy-content-tests.ps1
```

---

## 6) Open the CMS & Flow UIs

- CMS: https://cms.typerefinery.localhost:8101/
- Flow: https://flow.typerefinery.localhost:8101/

---

## 7) Test page (primary)

- View page:  
  https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/vizandform-local.html

- Edit page (Websight editor):  
  https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/os-triage/forms/vizandform-local::editor

---

## 8) What to verify (minimum)

- Page loads without console errors  
- Expected UI changes appear (layout, components, data visualisation)  
- Form behaviour and graph viz interactions work as per the issue  
- No regressions on linked/embedded components  
- Deploy scripts complete without errors  

---

## 9) Troubleshooting

- **Git pull blocked by local changes**  
  `git stash -u` (pull) → test → `git stash pop` (if needed)

- **Services not up on http://localhost:3001/services**  
  Re-run `.\start.ps1` scripts; check terminal for errors.

- **Deploy script errors**  
  Re-run `.\deploy-app.ps1` then `.\deploy-content-tests.ps1` and review the first error thrown.

- **Browser cache**  
  Hard refresh (Ctrl+F5) or open in a private window.

---

## 10) Reporting back in the ticket

Include:

- Commit hashes of each repo tested:
  - `typerefinery-websight` (develop): `git rev-parse --short HEAD`
  - `widget-graph-viz` (main): `git rev-parse --short HEAD`
  - `typerefinery` (master): `git rev-parse --short HEAD`
- Screenshot of **http://localhost:3001/services**
- URLs tested (view + editor)
- Steps taken & results
- Any logs/errors encountered

---

## 11) Clean-up (optional)

If you need to reset local state after testing:
```powershell
# In each repo if needed
git reset --hard
git clean -fdx
```

---

**That’s it.** Clone repos, pull latest on the specified branches, start services, deploy from `typerefinery-websight`, then verify via the test page and editor links above.
