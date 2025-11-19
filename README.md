# **JetSwitch**

## **Project Description**

JetSwitch is a modern music analysis and recommendation platform. Our goal is to **"Unlock your music taste"** by analyzing a user's uploaded song and finding other songs that match their unique style and sound.  
The application is built on a **microservices architecture** using **React** for the frontend, **Go** for the main backend logic, and a **Python API** for high-performance machine learning similarity search. All services are containerized using Docker for consistent development.

## **Tech Stack & Setup**

### **1\. Development Environment**

* **Version Control:** Git & GitHub  
* **Containerization:** Docker & Docker Compose  
* **Local Package Manager:** Nix (Recommended for consistent tool versions)

### **2\. Services**

| Service | Technology | Role |
| :---- | :---- | :---- |
| **Frontend** | Vite \+ React | User Interface and Client-side Logic |
| **Core Backend** | Go (Golang) | User Management, Session Handling, Primary API Logic |
| **ML Microservice** | Python | Song Similarity Search & Matching Score Calculation |
| **Database** | PostgreSQL \+ pgvector | Persistent storage for users, content, and song vectors |

## **Repository Structure**

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

## **4\. Local Development Setup (Developer Guide)**

To run the entire project, **Docker Compose is the required method** as it manages the networking and dependencies of the four microservices (Frontend, Backend, ML Service, and Postgres).

### **Prerequisites**

* Docker & Docker Compose (v2.0.0+)  
* Git

### **1\. Configuration Files**

You must create .env files inside the /backend and /ml\_service folders to define the service connections and secrets.

| Service Folder | File | Required Variables |
| :---- | :---- | :---- |
| backend/ | .env | DATABASE\_URL, JWT\_SECRET, ML\_SERVICE\_URL, GOOGLE\_CLIENT\_ID, etc. |
| ml\_service/ | .env | DATABASE\_DSN |

### **2\. Running Services**

Use Docker Compose to build and run all services and the primary database:  
\# Starts all services (Backend: 8080, ML: 8000, Frontend: 5173, DB: 5430\)  
docker compose up \--build

Once running, the application should be accessible at **http://localhost:5173**.

### **3\. Running Tests**

The test suite requires a dedicated **Test Database** running on port 5431\. You must start the containers using the test profile:  
\# Starts all production services PLUS the dedicated test database (postgres\_test:5431)  
docker compose \--profile test up \--build

With the services running, you can execute tests from within their respective containers:

| Service | Command to Run Tests (inside container shell) |
| :---- | :---- |
| **Frontend** | npm run test (Runs Playwright E2E tests) |
| **Core Backend** | go test ./... |
| **ML Service** | pytest |

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
* **Action:** 1\. Get the latest stable code from main:  
```
  git checkout main    
  git pull origin main
```
  2. Create your new branch. Use a clear, short name that describes the task (e.g., feature/user-login, feature/music-bar-ui).
```
  git checkout -b feature/your-task-name
```
  * **All of your coding work happens only in this new branch.**

#### **2\. Commit and Push**

* **Goal:** Save your progress and back up your work to GitHub.  
* **Action:** 1\. Commit your changes frequently with clear, descriptive messages:  
```
  git add .    
  git commit -m "feat: added basic structure for the login screen"
```
  2. Push your branch to GitHub for the first time:
```
git push -u origin feature/your-task-name
```
#### **3\. Finish and Review (The Pull Request)**

* **Goal:** Get your finished code reviewed and approved to be added to main.  
* **Action:** 
  1\. When your feature is complete and fully tested locally, go to GitHub and create a **Pull Request (PR)**.  
  2\. **Target Branch:** Ensure the PR is set to merge your feature/your-task-name **INTO** the **main** branch.  
  3\. **Review:** Ask at least one teammate to check your code and confirm it works.  
  4\. **Merge:** Once approved, the PR can be merged into main. The feature branch is then deleted.

#### **4\. Delete Done Feature Branch**

* **Goal:** To clean up the repository, so we won't end up with repository with hundreds of completed feature branch  
* **Action:**  
  1. Checkout to main first
```
  git checkout main
```
  2. Delete feature/done-feature branch in local repository
```
  git branch -d feature/done-feature
```
or even force delete it by
```
git branch -D feature/done-feature
```
  3. Delete feature/done-feature branch in remote repository
```
git push origin --delete feature/done-feature  
```
