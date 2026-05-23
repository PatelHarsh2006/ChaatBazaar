<img width="1983" height="793" alt="ChaatBazaar Header" src="https://github.com/user-attachments/assets/75162fe3-79d3-46d7-806f-9f8e78720fe9" />

<h1 align="center" id="chaatbazaar">ChaatBazaar 🍴 </h1>

<p align="center">
  <strong>An interactive, client-side web application bringing authentic Indian street food to your fingertips.</strong>
</p>

<p align="center">
  <a href="https://patelharsh2006.github.io/ChaatBazaar/">Live Demo</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-technical-design-decisions-adrs">Design Decisions</a> •
  <a href="#-contributing">Contributing</a>
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&height=4&color=FF7B54" width="100%">

## 🚀 Executive Summary

**ChaatBazaar** is a responsive, mobile-first web application engineered to simulate a dynamic e-commerce food delivery platform. By leveraging a strict client-side architecture without a backend dependency, it offers an incredibly fast and seamless ordering experience. It utilizes the browser's native capabilities (`LocalStorage`, `Fetch API`) for state management and data hydration.

## 🏗️ System Architecture

The application follows a monolithic client-side architecture. State is strictly managed within the browser, and data is hydrated asynchronously from static JSON assets.

```mermaid
graph TD
    %% User Interaction
    User((User)) --> |Interacts| UI[User Interface\nHTML/CSS]
    
    %% Core Logic
    UI --> |Triggers Events| CoreJS[Core Application Logic\nmain.js]
    
    %% State Management
    CoreJS --> |Read/Write Cart & Orders| Storage[(Browser LocalStorage)]
    
    %% Data Layer
    CoreJS --> |Fetch| Network[Fetch API]
    Network --> |Asynchronous Load| MenuData[Static Data\nmenu.json]
    
    %% Render Loop
    Storage -.-> |Hydrate State| CoreJS
    MenuData -.-> |Hydrate UI| CoreJS
    CoreJS -.-> |DOM Manipulation| UI

    classDef default fill:#fff8f0,stroke:#ff5722,stroke-width:2px;
    classDef storage fill:#fbe9e7,stroke:#bf360c,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    
    class Storage storage;
    class MenuData data;
```

### Architectural Layers
1. **Presentation Layer (`.html`, `.css`)**: Responsive, CSS-grid-heavy layout with modern UI tokens (glassmorphism, CSS variables).
2. **Business Logic Layer (`main.js`)**: Encapsulates cart logic, fuzzy-search algorithms, advanced filtering, and state hydration.
3. **Data Layer (`menu.json`)**: Serves as a read-only NoSQL-like document store loaded into memory upon initialization.

## 📝 Technical Design Decisions (ADRs)

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Vanilla JS over Frameworks** | Ensures zero build steps, rapid prototyping, and lowers the barrier to entry for open-source contributors. | Lacks reactive DOM updates; requires manual DOM manipulation. |
| **LocalStorage State Management** | Enables session persistence for the Cart and Orders without requiring a backend database or authentication. | Data is localized to the specific device/browser and lacks cross-device syncing. |
| **Static JSON Hydration** | Simulates a REST API call asynchronously. Allows easy schema updates without touching JS logic. | Cannot simulate dynamic inventory or real-time stock levels. |

<img src="https://capsule-render.vercel.app/api?type=rect&height=4&color=FF7B54" width="100%">

## ✨ Core Features

- **Asynchronous Data Loading**: Non-blocking data fetch operations.
- **Fuzzy Search Algorithm**: Custom sequence-matching search functionality for menu items.
- **Stateful Shopping Cart**: Persists across tabs and reloads natively using browser storage.
- **Client-side Filtering**: Multi-parameter filter engine (Price, Spice, Rating, Dietary).

<img src="https://capsule-render.vercel.app/api?type=rect&height=4&color=FF7B54" width="100%">

## 💻 Tech Stack

Built with modern, lightweight web technologies focusing on zero-dependency delivery:
* <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" /> Semantic Structure
* <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" /> Flexbox, CSS Grid, Advanced Selectors
* <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" /> ES6+, Fetch API, LocalStorage
* <img src="https://img.shields.io/badge/JSON-000000?style=flat-square&logo=json&logoColor=white" alt="JSON" /> Static Data Layer

<img src="https://capsule-render.vercel.app/api?type=rect&height=4&color=FF7B54" width="100%">

## 🤝 Contributing

We welcome contributions to expand the architecture! 

### Architectural Guidelines for Contributors
1. **Maintain the Theme**: Ensure UI components utilize the core orange palette (`#ff5722`, `#bf360c`).
2. **Visual Evidence**: Include "Before" and "After" screenshots of the webpage for all UI changes in the PR.
3. **Local Testing**: Run the project through a local server (e.g., VSCode Live Server) to bypass CORS restrictions on the `fetch()` API loading local JSON.

### Synchronization Workflows
Keep your fork in sync with the upstream repository to prevent merge conflicts.

#### Method 1: CLI Workflow (Recommended for Engineers)
```bash
# 1. Fetch latest changes from upstream
git fetch upstream

# 2. Fast-forward your local main branch
git merge upstream/main

# 3. Push updated code to your origin fork
git push origin main
```

#### Method 2: GitHub UI / Desktop
1. Navigate to your fork on GitHub.
2. Click **Sync fork** -> **Update branch**.
3. Open GitHub Desktop and click **Fetch origin** followed by **Pull origin**.

### Submitting a Pull Request
1. **Fork & Clone**
   ```bash
   git clone https://github.com/PatelHarsh2006/ChaatBazaar.git
   cd ChaatBazaar
   ```
2. **Branching Strategy**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit & Push** (Follow semantic commit formatting)
   ```bash
   git add .
   git commit -m "feat: implement advanced sorting algorithm for menu"
   git push origin feature/your-feature-name
   ```
4. **Open a PR** on GitHub with descriptive tags (`[UI]`, `[UX]`, `[Feature]`).

<img src="https://capsule-render.vercel.app/api?type=rect&height=4&color=FF7B54" width="100%">

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/PatelHarsh2006/ChaatBazaar/blob/main/LICENSE) file for details.

<a name="contacts"></a>
## 📬 Contacts

| Source | Link |
| :--- | :--- |
| **GitHub Profile** | [PatelHarsh2006](https://github.com/PatelHarsh2006) |
| **Project Repository** | [ChaatBazaar](https://github.com/PatelHarsh2006/ChaatBazaar) |

<p align="center">
  <b>⭐ Star the repo if you found this architectural approach useful!</b><br>
  Made with ❤️ for the 🌍
</p>
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:FFB347,25:FF8C00,50:FF6200,75:FF4D00,100:FF2D00&height=100&section=footer&animation=fadeIn" width="100%" />
</p>
