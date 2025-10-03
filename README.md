# ** JetSwitch**

## **Project Description**

JetSwitch is a modern music analysis and recommendation platform. Our goal is to **"Unlock your music taste"** by analyzing a user's uploaded song and finding other songs that match their unique style and sound.  
The application is built on a **microservices architecture** using **React** for the frontend, **Go** for the main backend logic, and a **Python API** for high-performance machine learning similarity search. All services are containerized using Docker for consistent development.

## ** Tech Stack & Setup**

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

## ** Repository Structure**

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

## ** Version Control and Branching Strategy**

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

  2. Create your new branch. Use a clear, short name that describes the task (e.g., feature/user-login, feature/music-bar-ui).  
  ```
     git checkout \-b feature/your-task-name
  ```

  * **All of your coding work happens only in this new branch.**

#### **2\. Commit and Push**

* **Goal:** Save your progress and back up your work to GitHub.  
* **Action:**  
  1. Commit your changes frequently with clear, descriptive messages:  
  ```
     git add .  
     git commit \-m "feat: added basic structure for the login screen"
  ```

  2. Push your branch to GitHub for the first time:  
  ```
     git push \-u origin feature/your-task-name
  ```

#### **3\. Finish and Review (The Pull Request)**

* **Goal:** Get your finished code reviewed and approved to be added to main.  
* **Action:**  
  1. When your feature is complete and fully tested locally, go to GitHub and create a **Pull Request (PR)**.  
  2. **Target Branch:** Ensure the PR is set to merge your feature/your-task-name **INTO** the **main** branch.  
  3. **Review:** Ask at least one teammate to check your code and confirm it works.  
  4. **Merge:** Once approved, the PR can be merged into main. The feature branch is then deleted.
