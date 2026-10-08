# N8N Automation Workflows

## 📋 Overview

This directory contains n8n workflow automations for the AI Business Trend Analysis Agent. The workflows provide automated monitoring, alerts, and reporting for your business financial metrics.

---

## 🚀 Features

- **Daily Health Checks**: Automated daily monitoring at 9 AM
- **Instant Telegram Alerts**: Real-time notifications for low ROI (< 10%)
- **Success Notifications**: Daily confirmations when business is healthy
- **Weekly Summaries**: Comprehensive weekly business reports (optional)
- **Smart Conditional Logic**: Different actions based on business performance
- **Professional Formatting**: Emoji-rich, Markdown-formatted messages

---

## 📁 Files in This Directory

```
n8n/
├── README.md                    ← This file
├── daily-health-check.json      ← Main workflow (daily monitoring)
└── weekly-summary.json          ← Optional weekly report workflow
```

---

## 🛠 Installation & Setup

### Step 1: Install n8n

Open PowerShell and run:

```powershell
npm install -g n8n
```

Verify installation:
```powershell
n8n --version
```

### Step 2: Start n8n

```powershell
n8n start
```

n8n will be accessible at: `http://localhost:5678`

### Step 3: Create Account

On first launch:
1. Open `http://localhost:5678`
2. Create a local account (email can be `admin@localhost` for local dev)
3. Set a password you'll remember

---

## 📱 Telegram Bot Setup

### 1. Create Your Bot

1. Open Telegram and search for: **@BotFather**
2. Send this command:
   ```
   /newbot
   ```
3. Follow the prompts:
   - **Bot Name**: `Business Trend Alert Bot` (or any name)
   - **Bot Username**: Must end in "bot" (e.g., `mytrendagent_bot`)
4. **Copy the token** BotFather gives you (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Chat ID

1. Start a chat with your new bot in Telegram
2. Send any message to it (like "hello")
3. Open this URL in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Look for the `"chat"` section in the JSON response:
   ```json
   {
     "chat": {
       "id": 123456789,  ← This is your Chat ID
       "first_name": "Your Name"
     }
   }
   ```
5. **Copy your Chat ID** (the number)

### 3. Configure in n8n

1. Import the workflow (see below)
2. Click on any Telegram node
3. Click **"Create New Credential"**
4. Enter:
   - **Credential Name**: `Business Alert Bot`
   - **Access Token**: Your bot token from BotFather
5. Click **"Save"**
6. In the Telegram node settings:
   - **Chat ID**: Your chat ID from step 2

---

## 📥 Import Workflows

### Import Daily Health Check

1. Open n8n at `http://localhost:5678`
2. Click **"Add Workflow"** or the **"+"** button
3. Click the **three dots (⋮)** menu → **"Import from File"**
4. Select `daily-health-check.json`
5. The workflow will load on the canvas

### Import Weekly Summary (Optional)

1. Click **"Add Workflow"** again
2. Click **⋮** → **"Import from File"**
3. Select `weekly-summary.json`
4. The workflow will load

---

## 🔄 Workflow 1: Daily Business Health Check

### Overview
Runs every day at 9:00 AM and checks your business metrics.

### Workflow Structure

```
⏰ Schedule Trigger (Daily 9 AM)
    ↓
🌐 Fetch Analytics (HTTP GET)
    ↓
🔀 Check ROI < 10% (IF Condition)
    ↓
    ├── TRUE  → 📱 Telegram: 🚨 LOW ROI ALERT
    │
    └── FALSE → 📱 Telegram: ✅ HEALTHY STATUS
```

### Nodes Explained

#### 1. Schedule Trigger
- **Type**: Cron-based scheduler
- **Frequency**: Every day at 9:00 AM
- **Purpose**: Automatically triggers the workflow daily

#### 2. Fetch Analytics
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `http://localhost:8000/api/v1/analytics/summary`
- **Purpose**: Retrieves current financial metrics from your FastAPI backend
- **Returns**: JSON with revenue, expense, profit, ROI, growth trends

#### 3. Check ROI < 10%
- **Type**: IF Conditional Node
- **Condition**: `{{ $json.summary.roi }} < 10`
- **Purpose**: Routes to different actions based on business health

#### 4. Telegram Alert (TRUE Branch)
- **Triggers When**: ROI is below 10%
- **Message Type**: Urgent alert with actionable recommendations
- **Format**: Markdown with emojis

**Sample Alert Message:**
```
🚨 URGENT: Low ROI Alert
⚠️ Your ROI has dropped below the 10% threshold

📊 Current Metrics:
• ROI: 8.5% ⬇️
• Revenue: $15,000
• Expense: $13,800
• Net Profit: $1,200
• Trend: declining

🎯 Immediate Actions Required:
1. Review expense categories
2. Analyze revenue streams
3. Check recent transactions
```

#### 5. Telegram Success (FALSE Branch)
- **Triggers When**: ROI is 10% or higher
- **Message Type**: Daily confirmation with metrics
- **Format**: Markdown with emojis

**Sample Success Message:**
```
✅ Daily Business Health Check
📊 Current Performance:
• ROI: 195.19%
• Revenue: $61,400
• Expense: $20,800
• Net Profit: $40,600
• Trend: growing

✨ Status: All metrics are healthy!
```

---

## 🔄 Workflow 2: Weekly Business Summary (Optional)

### Overview
Runs every Sunday at 6:00 PM and sends a comprehensive weekly report.

### Workflow Structure

```
⏰ Schedule Trigger (Every Sunday 6 PM)
    ↓
🌐 Fetch Analytics (HTTP GET)
    ↓
📱 Telegram: 📊 WEEKLY SUMMARY
```

### When It Runs
- **Day**: Every Sunday
- **Time**: 6:00 PM
- **Always Sends**: Yes (no conditional logic)

**Sample Weekly Summary:**
```
📊 Weekly Business Summary
Week ending February 23, 2026

💰 Financial Overview:
• Total Revenue: $61,400
• Total Expense: $20,800
• Net Profit: $40,600
• Current ROI: 195.19%

📈 Growth Analysis:
• Trend Direction: growing
• Avg Revenue Growth: 10.16%
• Avg Expense Growth: 5.23%

📅 This Week's Activity:
• Total Transactions: 8

🎯 Next Week's Focus:
Based on current trends, continue monitoring 
expense categories and maintain revenue momentum.
```

---

## ⚙️ Configuration & Customization

### Change Alert Threshold

To modify when alerts are sent:

1. Open the workflow in n8n
2. Click on the **"Check ROI < 10%"** IF node
3. Change **Value 2** to your desired threshold:
   - `5` → Alert when ROI < 5%
   - `15` → Alert when ROI < 15%
   - `20` → Alert when ROI < 20%

### Change Schedule Times

#### Daily Health Check:
1. Click on the **Schedule Trigger** node
2. Modify:
   - **Trigger at Hour**: Any hour (0-23)
   - **Trigger at Minute**: Any minute (0-59)

#### Weekly Summary:
1. Click on the **Schedule Trigger** node
2. Modify:
   - **Trigger on Day**: Monday-Sunday
   - **Trigger at Hour**: Any hour (0-23)

### Customize Messages

1. Click on any **Telegram** node
2. Edit the **Text** field
3. Use these variables in your message:

**Available Variables:**
```
{{ $node["Fetch Analytics"].json.summary.roi }}
{{ $node["Fetch Analytics"].json.summary.total_revenue }}
{{ $node["Fetch Analytics"].json.summary.total_expense }}
{{ $node["Fetch Analytics"].json.summary.net_profit }}
{{ $node["Fetch Analytics"].json.growth.trend_direction }}
{{ $node["Fetch Analytics"].json.growth.avg_revenue_growth }}
{{ $now.format('MMMM D, YYYY') }}
{{ $now.format('dddd') }}
```

### Add More Conditions

Want to check multiple thresholds? Add more IF nodes:

**Example: Three-tier alert system**
```
IF ROI < 5%    → 🔴 CRITICAL ALERT
IF ROI < 10%   → 🟡 WARNING ALERT
IF ROI >= 10%  → 🟢 HEALTHY STATUS
```

---

## 🧪 Testing Workflows

### Test Immediately (Without Waiting for Schedule)

1. Open the workflow in n8n
2. Click **"Execute Workflow"** button (top-right)
3. Check your Telegram for the message
4. Review the output of each node in the right panel

### Test Both Alert Types

**To test the LOW ROI alert:**

**Option 1 - Temporarily flip the condition:**
1. Click the **"Check ROI < 10%"** IF node
2. Change **Operation** from `Smaller` to `Larger`
3. Change **Value 2** to `100`
4. Execute workflow → You'll get the alert
5. **Change it back** when done testing

**Option 2 - Add test data:**
1. Go to `http://localhost:5173/add`
2. Add a large expense (e.g., $100,000)
3. Your ROI will drop temporarily
4. Execute workflow
5. Delete the test transaction after

---

## 🚨 Troubleshooting

### Issue: "Could not connect to Telegram"

**Solution:**
1. Verify your bot token is correct
2. Make sure you've started the bot (sent a message to it)
3. Check that your Chat ID is a number (not a string)
4. Test the bot token manually:
   ```
   https://api.telegram.org/botYOUR_TOKEN/getMe
   ```
   Should return bot info

### Issue: "Cannot reach backend"

**Error Message:** `ECONNREFUSED` or timeout

**Solution:**
1. Make sure FastAPI backend is running:
   ```powershell
   cd C:\app\ai-business-trend-agent\backend
   venv\Scripts\Activate
   uvicorn app.main:app --reload --port 8000
   ```
2. Test the endpoint manually: `http://localhost:8000/api/v1/analytics/summary`
3. Check if port 8000 is blocked by firewall

### Issue: Workflow doesn't trigger automatically

**Solution:**
1. Make sure the workflow is **Active** (toggle switch ON)
2. Check that n8n is still running (`n8n start`)
3. Verify the schedule is set correctly
4. n8n must stay running for scheduled workflows to execute

### Issue: No data in analytics response

**Error Message:** `No transaction data found`

**Solution:**
1. Add at least one transaction via the frontend
2. Go to `http://localhost:5173/add`
3. Create a revenue or expense entry
4. Re-execute the workflow

---

## 🔐 Security Best Practices

### For Development (Current Setup)
- ✅ Bot token stored in n8n credentials (encrypted)
- ✅ Local-only access (localhost)
- ✅ No internet exposure

### For Production Deployment

1. **Secure Bot Token**:
   - Never commit bot tokens to Git
   - Use environment variables
   - Rotate tokens periodically

2. **Restrict Chat ID**:
   - Only use your personal chat ID
   - Don't share the bot publicly
   - Consider group chat for teams

3. **n8n Security**:
   - Set up authentication
   - Use HTTPS in production
   - Enable webhook security

4. **Backend Security**:
   - Add API authentication
   - Use environment-specific URLs
   - Enable CORS restrictions

---

## 📊 Monitoring & Logs

### View Execution History

1. Open n8n → **Executions** tab (left sidebar)
2. See all past workflow runs
3. Click any execution to see:
   - Input/output of each node
   - Execution time
   - Success/failure status

### Failed Execution Alerts

To get notified if a workflow fails:

1. Add an **Error Trigger** node to your workflow
2. Connect it to a Telegram node
3. Message: "⚠️ Workflow failed - check n8n logs"

---

## 🌐 Production Deployment

### Option 1: n8n Cloud (Easiest)

1. Sign up at: `https://n8n.io/cloud`
2. Import your workflows
3. Configure credentials
4. Workflows run in the cloud (no local machine needed)

### Option 2: Self-Hosted on VPS

**Requirements:**
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- Minimum 1GB RAM

**Installation:**
```bash
npm install -g n8n
n8n start --tunnel
```

**Run as Service:**
```bash
sudo npm install -g pm2
pm2 start n8n
pm2 save
pm2 startup
```

### Option 3: Docker Deployment

Create `docker-compose.yml` in the n8n directory:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
    volumes:
      - ./n8n-data:/home/node/.n8n
```

Run:
```bash
docker-compose up -d
```

---

## 📈 Advanced Workflow Ideas

### 1. Multi-Channel Alerts
- Send to Telegram + Email + Slack simultaneously
- Different channels for different severity levels

### 2. Expense Category Analysis
- Fetch `/api/v1/analytics/categories`
- Alert if any category exceeds budget
- Weekly category breakdown

### 3. Predictive Alerts
- Track trends over time
- Alert if declining trend detected
- Forecast next month's performance

### 4. Automated Data Export
- Weekly CSV export of transactions
- Send to Google Drive
- Backup to cloud storage

### 5. Integration with Other Tools
- Post to Slack channel
- Update Google Sheets
- Create Notion database entries
- Send SMS via Twilio

---

## 🔧 Maintenance

### Keep n8n Updated

```powershell
npm update -g n8n
```

### Backup Workflows

**Export regularly:**
1. Click **⋮** on each workflow
2. Select **"Download"**
3. Store in version control (Git)

**Backup credentials:**
- Export from n8n settings
- Store securely (encrypted)

### Monitor Performance

Check n8n logs:
```powershell
# View running n8n logs
n8n start
```

---

## 📞 Support & Resources

### Official n8n Documentation
- Website: https://n8n.io
- Docs: https://docs.n8n.io
- Community Forum: https://community.n8n.io

### Telegram Bot API
- Documentation: https://core.telegram.org/bots/api
- BotFather: https://t.me/botfather

### FastAPI Backend
- Your API docs: http://localhost:8000/docs
- Endpoint reference: See backend README.md

---

## 📝 Changelog

### v1.0.0 - Initial Release
- Daily health check workflow
- Telegram integration
- Conditional ROI alerts
- Success notifications

### v1.1.0 - Weekly Summary
- Added weekly reporting workflow
- Enhanced message formatting
- Improved error handling

---

## 🎯 Future Enhancements

Planned features for future versions:

- [ ] SMS alerts via Twilio
- [ ] Email reports with charts
- [ ] Slack workspace integration
- [ ] AI-powered anomaly detection
- [ ] Custom dashboard in n8n
- [ ] Multi-user support
- [ ] Expense budget tracking
- [ ] Revenue forecasting alerts

---

## 📄 License

Part of the AI Business Trend Analysis Agent project.
See main project README for license information.

---

## 🙏 Credits

- Built with n8n (https://n8n.io)
- Telegram Bot API
- FastAPI backend integration
- Created as part of AI Business Analytics Portfolio Project

---

**Ready to automate your business monitoring? Import the workflows and start receiving alerts today!** 🚀
