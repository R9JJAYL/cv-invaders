# Google Sheets Leaderboard Plan

## Architecture
1. **Google Sheet** — stores all scores in a spreadsheet you can view/manage
2. **Google Apps Script** — acts as a REST API (POST to save, GET to fetch)
3. **Secret token** — hardcoded in the Apps Script, sent by the game with every request. Script rejects requests without the correct token.
4. **Game code** — replaces localStorage save/load with fetch calls to the Apps Script URL

## Security Measures
- **Secret token**: Game sends a token with every request; Apps Script rejects without it
- **Score cap**: Reject scores above 30,000 (max realistic score)
- **Rate limiting**: One submission per IP per 30 seconds (stored in a separate sheet tab)
- **Input sanitization**: Strip HTML/scripts from name and company fields
- **CORS**: Apps Script only accepts requests from your game's domain

## Google Apps Script (you'll create this in Google Drive)
The script will have two endpoints:
- `GET ?action=getScores&token=SECRET` — returns top 50 scores as JSON
- `POST ?action=addScore&token=SECRET` — adds a score, returns updated top 50

## Sheet Structure
**Tab 1: "Scores"**
| Name | Company | Type | Score | Grade | Date |
|------|---------|------|-------|-------|------|

**Tab 2: "RateLimit"** (auto-managed)
| IP | LastSubmit |

## Game Code Changes
1. **config.js** — add `LEADERBOARD_URL` and `LEADERBOARD_TOKEN`
2. **GameOverScene.js** — `saveScore()` → POST to Apps Script, `getLeaderboard()` → GET from Apps Script
3. **MenuScene.js** — `getLeaderboard()` → GET from Apps Script
4. **Remove FakeLeaderboard** — no longer needed once real scores exist (or keep as fallback if API fails)

## Steps
1. I'll write the Google Apps Script code for you to paste into Google Drive
2. I'll update config.js with the API URL placeholder
3. I'll update saveScore/getLeaderboard in both scenes to use fetch()
4. Leaderboard loads async — show "Loading..." while fetching
5. Falls back to localStorage + fake data if the API call fails
