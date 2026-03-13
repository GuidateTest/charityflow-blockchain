# Push to GitHub — Quick Guide

Your project is committed locally. To share with your teacher, push to GitHub:

## Step 1: Create a GitHub repository

1. Go to **https://github.com** and sign in (or create an account).
2. Click the **+** icon (top right) → **New repository**.
3. Name it: `charityflow-blockchain` (or any name you like).
4. Choose **Public**.
5. **Do NOT** check "Add a README" or "Add .gitignore" — your project already has them.
6. Click **Create repository**.

## Step 2: Add remote and push

Copy the commands GitHub shows (or use these — replace `YOUR_USERNAME` with your GitHub username):

```bash
cd "c:\Users\DXB GAMERS\Desktop\project-blockchain"

git remote add origin https://github.com/YOUR_USERNAME/charityflow-blockchain.git
git branch -M main
git push -u origin main
```

**Example:** If your username is `seifmaloufi`:
```bash
git remote add origin https://github.com/seifmaloufi/charityflow-blockchain.git
git branch -M main
git push -u origin main
```

## Step 3: Share the link

After pushing, your repo URL will be:
```
https://github.com/YOUR_USERNAME/charityflow-blockchain
```

Send this link to your teacher.

---

**Optional — set your name/email before pushing:**
```bash
git config user.name "Seif Sid Ali Maloufi"
git config user.email "your.email@example.com"
```

**Note:** If Git asks for credentials, use a **Personal Access Token** (not your password):
- GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Use the token as the password when Git prompts you.
