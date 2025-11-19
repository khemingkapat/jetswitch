# **ML Microservice (Python FastAPI) Developer Guide**

This guide details the development and testing environment for the JetSwitch ML service, which handles audio analysis and vector similarity search.

## **Local Setup**

The ML Microservice is the high-performance core of the song similarity search.

### **Dependencies & Tools**

* **Python Version:** Python 3.13 is required.  
* **Package Manager:** We use uv for dependency management.  
* **System Libraries:** ffmpeg and libsndfile are required for audio processing (handling by Docker/Nix).  
* **Core Libraries:** fastapi, numpy, librosa, and psycopg2-binary (with pgvector).

### **1\. Configuration (ml\_service/.env file)**

Create a .env file in the /ml\_service directory containing the database connection string:

| Variable | Example Value (Local Docker) | Purpose |
| :---- | :---- | :---- |
| DATABASE\_DSN | postgresql://admin:admin@postgres:5432/jetswitch | Connection string to the PostgreSQL database with pgvector. |

### **2\. Running the Service**

1. **Install dependencies:**  
   uv sync

2. **Start the service:**  
   uvicorn main:app \--host 0.0.0.0 \--port 8000  
   \# The ML service will be accessible via http://localhost:8000

### **3\. API Documentation (FastAPI Advantage)**

FastAPI automatically generates the API documentation based on your code's Pydantic models and type hints.

| Documentation | URL |
| :---- | :---- |
| **Swagger UI** (Interactive) | http://localhost:8000/docs |
| **ReDoc** (Reference) | http://localhost:8000/redoc |

### **Contribution & Testing**

| Area | Command | Detail |
| :---- | :---- | :---- |
| **Formatting** | black . | Code style is enforced using Black (4 spaces). |
| **Testing** | pytest | Runs all unit and integration tests found in the tests/ directory. |
| **Test DB Requirement** | The tests require the separate **Test Database** running on Docker Compose port 5431\. You must run docker compose \--profile test up \--build first. |  |
| **Service Layer** | All business logic (downloading, feature extraction, scoring) must reside within the MusicAnalysisService in src/extractors/youtube\_extractor.py. The FastAPI main.py file should remain a thin HTTP layer. |  |

## **Development Workflow**

Follow the **GitHub Flow** outlined in the main README.md. Ensure all new code passes black formatting and pytest before submitting a Pull Request.
