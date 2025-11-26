# 🚀 How to Run This Project Locally

Follow the steps below to set up and run this backend application on your local machine.


### 📥 1. Clone the Repository
```
git clone <your-repo-url>
cd <project-folder-name>
```

### 📦 2. Install Dependencies
All required packages are already listed inside package.json.
Install all dependencies with:
```
npm install
```

### 🔐 3. Environment Setup
Create a `.env` file in the project root:
```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### ▶️ 4. Running the Application
Development mode (auto restart using nodemon)
```
npm run dev
```
Server will start on:
```
http://localhost:<PORT>
```
