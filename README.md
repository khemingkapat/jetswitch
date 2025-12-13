# **JetSwitch**

## **Project Description**

JetSwitch is a modern music analysis and recommendation platform. Our goal is to **"Unlock your music taste"** by analyzing a user's uploaded song and finding other songs that match their unique style and sound.
The application is built on a **microservices architecture** using **React** for the frontend, **Go** for the main backend logic, and a **Python API** for high-performance machine learning similarity search. All services are containerized using Docker for consistent development.

### **Tech Stack & Services**

| Service | Technology | Role |
| :---- | :---- | :---- |
| **Frontend** | Vite + React | User Interface and Client-side Logic |
| **Core Backend** | Go (Golang) | User Management, Session Handling, Primary API Logic |
| **ML Microservice** | Python | Song Similarity Search & Matching Score Calculation |
| **Database** | PostgreSQL + pgvector | Persistent storage for users, content, and song vectors |

### **Live Deployment**

The application is currently deployed and running at [here](https://react-frontend-production-9bec.up.railway.app/)

## **1. Local Development Setup**

### **Prerequisites**

The recommended and most straightforward way to run this project is using **Docker Compose**.

| Setup Method | Required Software |
| :---- | :---- |
| **Recommended** | **Docker & Docker Compose** (v2.0.0+) |
| **Alternative (NATIVE)** | **Go 1.25**, **Node.js (v22+)**, **Python 3.13+** (with uv) |

* **General Tools:** Git
* **Toolchain Management (Optional but Recommended):** Nix (For consistent tool versions)

### **Installation**

Since the project uses Docker Compose, the installation of language dependencies (Node.js, Go, Python packages) happens automatically during the build process.

1. **Clone the Repository:**
```
git clone https://github.com/khemingkapat/jetswitch
cd jetswitch
```
### **Configuration**

You must create environment variable files in two service folders (/backend and /ml-service) to define service connections and secrets:

| Service Folder | File | Required Variables (Examples) |
| :---- | :---- | :---- |
| backend/ | .env | DATABASE_URL, JWT_SECRET, ML_SERVICE_URL, GOOGLE_CLIENT_ID, etc. |
| ml_service/ | .env | DATABASE_DSN |

**Note**: Don't forget to rename "\backend\.env.example" and "\ml_service\.env.example" into -> "\.env"
and put secret id,key in "\backend\.env" otherwise google register/login not work
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
JWT_SECRET=<your-jwt-secret-key>
DB_USER=<user, admin if you using in docker>
DB_PASSWORD=<user, admin if you using in docker>

### **How to Run (Recommended: Docker Compose)**

Use Docker Compose to build and run all four microservices and the primary database simultaneously.

* **Command to start the server:**
```
docker compose up --build
```
* **Access:** Once running, the application should be accessible at: **http://localhost:5173**

### **Alternative: Running Services Natively (Without Docker)**

You can run each service on your host machine, but you **must manually start the PostgreSQL database separately** (e.g., via Docker or a local installation) before running the services.

#### **A. Frontend (/frontend)**

Requires: Node.js (v22+)

1. Navigate to the directory:
```
cd frontend
```
2. Install dependencies:
```
npm install
```

3. Run the application:
```
npm run dev
```
#### **B. Core Backend (/backend)**

Requires: Go 1.25

1. Navigate to the directory:
```
cd backend
```
2. Run the application (it will automatically download Go dependencies):
```
go run main.go
```
#### **C. ML Microservice (/ml_service)**

Requires: Python 3.13+ and uv

1. Navigate to the directory:
```
cd ml_service
```
2. Install dependencies using uv (faster Python package manager):
```
uv sync
```
3. Run the FastAPI application:
```
uvicorn main:app --reload
```
### **Explaining how to import DB data**

The database schema is automatically handled by the Docker setup.

* **For SQL (PostgreSQL/pgvector):** The database container automatically runs the schema definition found in db/init.sql upon first startup, creating all necessary tables and the vector extension.
* **Initial Data:** There is no separate seed script. The database will be empty upon startup.

## **2\. Testing and Credentials**

### **Test Credentials**

Since there are no default seeded users, please create your own account for testing:

* **User Registration:** Register a new user on the application's login page (http://localhost:5173/register) and choose either the listener or artist role.

### **Running Tests**

The test suite requires a dedicated **Test Database** running on port 5431\.

1. **Start Test Services:**
```
docker compose --profile test up --build
```
2. **Execute Tests:** Run the test command from the root folder *inside* the respective service containers:

| Service | Command to Run Tests (inside container shell) |
| :---- | :---- |
| **Frontend** | npm run test (Runs Playwright E2E tests) |
| **Core Backend** | go test ./... |
| **ML Service** | pytest |

## **3\. Project Status & Known Issues**

| Status | Details |
| :---- | :---- |
| **Known Issue (Critical)** | The Python ML Service's YouTube audio download function is currently unstable. YouTube detection often causes downloads to fail. |
| **Workaround** | To fix this, the ML service must be configured to use cookie-based authentication for yt-dlp. Refer to the [yt-dlp extractor documentation](https://github.com/yt-dlp/yt-dlp/wiki/extractors) for implementation guidance. |
| **Feature Status** | All core microservices (Frontend, Go Backend, Python ML) are built and functional within the Docker environment. |

## **4\. Repository Structure (Monorepo)**

The project uses a **Monorepo** structure. Each service is self-contained in its own folder, making it easier for different teams to work in parallel.
```
/jetswitch (project-root)
├── /frontend/            \# Vite \+ React (UI)
├── /backend/             \# Go Core API
├── /ml-service/          \# Python ML Microservice
├── /db/                  \# Database setup files (init scripts)
├── docker-compose.yml    \# Defines how all services run together
├── .gitignore            \# Files Git should ignore
└── README.md             \# This document
```
## **5\. Version Control and Branching Strategy**

We use a simple **GitHub Flow** with only two main branch types: main and feature/xxx.
**The most important rule is that the main branch must always be stable and ready to deploy.** All new work must be done in a separate feature branch.

### **The Two Branch Types**

| Branch Type | Purpose | Source Branch | Destination |
| :---- | :---- | :---- | :---- |
| **main** | **Production Code.** This branch is always stable. | N/A | Feature branches merge **into** main. |
| **feature/xxx** | **All New Work.** This is where you create new features or fix bugs. | main | Merge **into** main. |

### **Detailed Workflow for Every Task**

This process ensures that no unfinished or broken code ever reaches the main branch.

#### **1\. Start Your Work (Create a Feature Branch)**

* **Goal:** Start a new, clean environment for your work.
* **Action:**
  1. Get the latest stable code from main:
```
git checkout main
git pull origin main
```
  2. Create your new branch. Use a clear, short name that describes the task (e.g., feature/user-login).
```
git checkout -b feature/your-task-name
```
  * **All of your coding work happens only in this new branch.**

#### **2. Commit and Push**

* **Goal:** Save your progress and back up your work to GitHub.
* **Action:**
  1. Commit your changes frequently with clear, descriptive messages:
```
git add .
git commit -m "feat: added basic structure for the login screen"
```
  2. Push your branch to GitHub for the first time:
```
git push -u origin feature/your-task-name
```
#### **3. Finish and Review (The Pull Request)**

* **Goal:** Get your finished code reviewed and approved to be added to main.
* **Action:**
  1. When your feature is complete and fully tested locally, go to GitHub and create a **Pull Request (PR)**.
  2. **Target Branch:** Ensure the PR is set to merge your feature/your-task-name **INTO** the **main** branch.
  3. **Review:** Ask at least one teammate to check your code and confirm it works.
  4. **Merge:** Once approved, the PR can be merged into main. The feature branch is then deleted.

#### **4\. Delete Done Feature Branch**

* **Goal:** To clean up the repository, so we won't end up with hundreds of completed feature branches.
* **Action:**
  1. Checkout to main first:
```
git checkout main
```
  2. Delete the feature branch in the local repository:
```
git branch -d feature/done-feature

*or force delete it by:*
git branch -D feature/done-feature
```
  3. Delete the feature branch in the remote repository:
```
git push origin --delete feature/done-feature
```
