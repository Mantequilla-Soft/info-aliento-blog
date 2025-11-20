# Hive Witness Directory 🐝

A modern web application for exploring and interacting with Hive blockchain witnesses. View real-time witness data, check network statistics, and participate in blockchain governance by voting for witnesses.

![Hive Witness Directory](https://img.shields.io/badge/Hive-Blockchain-red) ![Status](https://img.shields.io/badge/Status-Active-success)

## 🌟 What is this?

This is a **Witness Directory** for the Hive blockchain - think of it as a dashboard where you can:

- **Discover Witnesses**: Browse all active witnesses who help secure the Hive blockchain
- **View Statistics**: See real-time network data like block height, transactions, and more
- **Block Production Schedule**: Watch witnesses produce blocks in real-time with live rotation tracking
- **Vote for Witnesses**: Support your favorite witnesses using Hive Keychain (up to 30 votes)
- **Check API Nodes**: Find the best Hive API nodes with performance scores
- **Track Your Activity**: View your voting power, witness votes, and account stats

## ✨ Key Features

### 🔍 Witness Explorer
- Complete list of all Hive witnesses with their rankings
- Real-time vote counts and governance power
- Witness profiles with descriptions and version information
- Active status indicators (witnesses who recently produced blocks)
- **Complete voter lists** - See ALL voters for any witness (1000+ for popular witnesses)
- **Voter power breakdown** - View each voter's own HP and proxied HP
- **Voting power distribution** - Interactive pie chart showing top 10 voters
- **Historical voting trends** - Track vote changes over 7 or 30 days with charts

### 📊 Network Dashboard
- Live blockchain statistics
- Current HIVE price
- Active witness count
- Transaction volume

### ⏱️ Block Production Schedule
- **Real-time tracking** - See which witness is producing blocks right now
- **Live updates** - Schedule refreshes every 3 seconds (matching Hive block time)
- **Next 20 witnesses** - View the upcoming rotation order
- **Upcoming backup witnesses** - See backup witnesses (rank 21+) scheduled soon
- **Complete backup list** - Full directory of all 80+ backup witnesses with ranks
- **Time estimates** - Hover any witness to see when they'll produce next block
- **Interactive profiles** - Click any witness to view their detailed profile
- **Shuffle countdown** - Track blocks until next schedule rotation
- **Bilingual support** - Available in English and Spanish

### 🌐 API Nodes Monitor
- Performance scores for all Hive API nodes
- Version tracking for each node
- Sortable table to find the best nodes
- Real-time status updates

### 👤 User Stats
- **Hive Power breakdown** - View own HP, effective HP, and proxied HP
- **Governance power calculator** - See your total voting influence
- **Witness votes tracker** - List of all 30 witnesses you're voting for
- **Proxy voting information** - See who's delegating power to you
- **Lifetime earnings** - Author rewards, curation rewards, and earning strategy
- **Public profiles** - View any Hive user's stats at `/@username`

### 🔐 Secure Authentication
- Login with **Hive Keychain** browser extension
- No passwords stored - everything happens securely in your browser
- Multi-account support - save and switch between accounts
- Development mode available for testing without Keychain

## 🌍 Language Support

The site is fully **bilingual**:
- 🇺🇸 English
- 🇪🇸 Español

Switch languages anytime using the language toggle in the header.

## 🎨 Themes

Choose your preferred viewing experience:
- ☀️ Light mode
- 🌙 Dark mode

## 🚀 How to Use

### Viewing Block Production Schedule
1. Visit the "Schedule" page from the main navigation
2. See the currently producing witness with live "LIVE" indicator
3. View the next 20 witnesses in rotation order
4. Scroll down to see all backup witnesses (rank 21+)
5. Hover over any witness to see time until their next block

### Viewing Witnesses
1. Visit the home page to see the top witnesses
2. Click "View All Witnesses" to see the complete list
3. Click on any witness name to view their detailed profile

### Voting for Witnesses
1. Click "Login" and connect your Hive Keychain
2. Browse witnesses and click the "Vote" button on any witness
3. Confirm the transaction in Keychain
4. Your vote is recorded on the blockchain!

### Checking Your Stats
1. After logging in, click on your username in the header
2. View your Hive Power and witness votes
3. See how much voting power you have remaining

### Finding Best API Nodes
1. Visit the "API Nodes" page from the network stats section
2. Sort by score to find the most reliable nodes
3. Click any node URL to visit it directly

## 🛠️ For Developers

If you want to run this project locally or contribute:

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Hive Keychain browser extension (for authentication)

### Installation
```bash
# Clone the repository
git clone https://github.com/Mantequilla-Soft/info-aliento-blog.git

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3007
```

### Building for Production
```bash
npm run build
npm run start
```

## 📱 Mobile Friendly

The entire site is fully responsive and works great on:
- 📱 Phones
- 📲 Tablets  
- 💻 Desktop computers

## 🔗 Built With

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe code
- **Tailwind CSS + shadcn/ui** - Beautiful, accessible components
- **TanStack Query** - Powerful data fetching and caching
- **Recharts** - Interactive charts for voting trends
- **Vite** - Lightning-fast development and building
- **Wouter** - Lightweight client-side routing

### Backend & APIs
- **Express.js** - API server
- **Hive Blockchain APIs** - Real-time blockchain data
- **HAFBE API** - Complete voter data and historical analytics
- **Hive Keychain SDK** - Secure wallet integration
- **PostgreSQL + Drizzle ORM** - Database (optional, in-memory for dev)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available for use by the Hive community.

## 🆘 Support

If you encounter any issues or have questions:
1. Check that you have Hive Keychain installed and unlocked
2. Make sure you're using a modern browser (Chrome, Firefox, Brave, Edge)
3. Clear your browser cache if you see stale data
4. Report issues on GitHub: https://github.com/Mantequilla-Soft/info-aliento-blog/issues

## 🎉 Recent Improvements (November 2024)

### Latest Release: Block Production Schedule 🆕
- ✅ **Real-time Schedule Tracking** - Live witness block production with 3-second updates
- ✅ **Interactive Schedule View** - See next 20 witnesses in rotation order
- ✅ **Backup Witnesses Display** - Complete list of all backup witnesses (rank 21+) with ranks
- ✅ **Time-to-Block Estimates** - Hover tooltips showing when each witness produces next
- ✅ **Upcoming Backup Section** - Special section for backup witnesses in next 20 slots
- ✅ **Schedule Page** - Dedicated `/schedule` route with full schedule details
- ✅ **Home Preview** - Quick schedule preview on home page
- ✅ **Bilingual Schedule** - Full EN/ES translation support for all schedule features
- ✅ **Mobile Optimized** - Responsive grids for mobile, tablet, and desktop

### Major Features Added
- ✅ **Complete Voter Data** - Migrated to HAFBE API for 100% complete voter lists
- ✅ **Historical Trends** - Added voting trend charts (7-day and 30-day views)
- ✅ **Proxy Power Tracking** - View who's delegating voting power to you
- ✅ **Activity Feed** - Real-time witness voting activity with HP breakdown
- ✅ **Mobile Zoom** - Fixed accessibility issue blocking mobile zoom
- ✅ **Smart Polling** - API requests pause when tab is hidden (saves battery)
- ✅ **CORS Fix** - Proxied HAFBE API calls through backend for reliability
- ✅ **Vercel SPA Routing** - Fixed direct navigation to all routes

### Performance Improvements
- 🚀 80% faster voter data loading (2-3s vs 10-20s)
- 🔋 Reduced battery usage with intelligent polling
- 💾 Better caching with React Query
- 📱 Improved responsive design across all pages

## ⚡ Performance

- **80% faster voter data** - Fetches complete voter lists in 2-3 seconds (vs 10-20s before)
- **Smart API polling** - Automatically pauses when tab is hidden to save battery
- **Efficient caching** - React Query caches data to minimize API calls
- **Mobile optimized** - Separate mobile/desktop views for best experience

## 🙏 Acknowledgments

- Built for the **Hive community** by **@aliento**
- Powered by **Hive blockchain APIs** and **HAFBE API** (Syncad)
- Uses **PeakD Beacon** for API node monitoring
- Special thanks to all Hive witnesses and voters!

---

**Made with ❤️ for the Hive community**
