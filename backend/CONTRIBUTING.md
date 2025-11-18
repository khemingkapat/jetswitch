# ** Go Backend (Core API) Developer Guide**

This guide details the local setup, contribution guidelines, and testing requirements for the JetSwitch Go Fiber Core API.

## **Local Setup**

The Core API acts as the authentication layer and the gateway to the ML Microservice.

### **Dependencies**

* **Go Version:** Go 1.25.0+ (as defined in go.mod).  
* **Database:** PostgreSQL with the pgvector extension running (local port 5430 is used by Docker Compose).

### **1\. Configuration (backend/.env file)**

You must create a .env file in the /backend directory with these variables to connect to other services and secure the application:

| Variable | Example Value (Local Docker) | Purpose |
| :---- | :---- | :---- |
| DATABASE\_URL | postgres://admin:admin@postgres:5432/jetswitch?sslmode=disable | Connection string to the main PostgreSQL database. |
| JWT\_SECRET | a-very-long-secret-key-for-auth | Secret key used to sign and verify JWT tokens. |
| ML\_SERVICE\_URL | http://ml\_service:8000 | Internal URL to communicate with the Python ML service. |
| GOOGLE\_CLIENT\_ID | \[Your Google OAuth ID\] | For Google sign-in integration. |

### **2\. Running the Service**

You can start the service using Docker Compose (preferred) or directly with Go.  
\# Start all services defined in docker-compose.yml  
docker compose up \--build  
\# The backend will run on: http://localhost:8080

### **Contribution & Testing**

| Area | Command | Detail |
| :---- | :---- | :---- |
| **Formatting** | gofmt \-w . | Ensures code style compliance (using tabs for indentation). |
| **API Docs** | Run swag init | Regenerates the OpenAPI specification (docs.go, swagger.json, swagger.yaml). This is required whenever API handlers change. |
| **Unit Tests** | go test ./... | Runs all tests in the package hierarchy. Note: Requires the separate **Test Database** to be running on port 5431\. |
| **Test Fixtures** | Test setup relies on testutils/test\_db.go to ensure a clean slate and consistent user IDs for integration tests. |  |

## **Development Workflow**

Follow the **GitHub Flow** outlined in the main README.md: create a feature branch, commit often, and submit a Pull Request to merge into main.
