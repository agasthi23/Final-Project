Final Year Project - Utility Bill Prediction and Management System
 
A web-based intelligent utility management platform designed for Sri Lankan households and small businesses. The system predicts future water and electricity bills using historical consumption data and localized tariff structures from the National Water Supply and Drainage Board (NWSDB) and the Ceylon Electricity Board (CEB).

The platform combines utility bill forecasting, anomaly detection, budgeting, analytics visualization, and tariff-aware calculations into a single integrated dashboard.

✨ Features
Utility bill prediction for water and electricity
Adaptive forecasting using Weighted Average, Linear Regression, and SARIMA
Tariff-aware bill calculation based on Sri Lankan utility pricing models
Consumption anomaly detection with automated email alerts
Income-based utility budgeting and expense tracking
Interactive analytics dashboard with charts and reports
User authentication and role-based access control
Admin tariff management system
PDF report generation
Responsive web interface
🛠️ Technology Stack
Layer	Technologies
Frontend	React.js, Tailwind CSS, Axios, Chart.js / Recharts
Backend	Node.js, Express.js, JWT Authentication, Nodemailer
Machine Learning	Python FastAPI, Pandas, Statsmodels, Scikit-learn
Database	MongoDB Atlas, Mongoose ODM
🧠 Machine Learning Approach
The system uses an adaptive forecasting strategy based on the amount of available historical billing data:

Historical Data Available	Forecasting Method
Less than 6 months	Weighted Average
6–11 months	Linear Regression
12 months or more	SARIMA
This approach balances prediction accuracy with practical real-world data limitations commonly found in Sri Lankan households.

📦 Key Functional Modules
1.Authentication Module
2.Bill Management Module
3.Prediction Module
4.Analytics Dashboard
5.Budget Management Module
6.Reports Module
7.Settings Module
8.Admin Dashboard
9.Tariff Management Module
10.User Management Module
🏗️ System Architecture
The system follows a five-tier architecture:

Presentation Tier — React.js frontend
API Gateway and Authentication Layer — JWT middleware
Application Tier — Node.js/Express.js backend
Machine Learning Tier — Python FastAPI microservice
Data Tier — MongoDB Atlas cloud database
📂 Project Structure
Final-Project/
│
├── frontend/ # React frontend application
├── backend/ # Node.js Express backend
├── ml-service/ # Python FastAPI machine learning service
├── screenshots/ # System screenshots and assets
└── README.md

text


---

## 🚀 Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/agasthi23/Final-Project.git
Frontend Setup
bash

cd frontend
npm install
npm run dev
Backend Setup
bash

cd backend
npm install
npm start
Machine Learning Service Setup
bash

cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
⚙️ Environment Variables
Create a .env file in the backend directory and configure:

env

MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
📊 Evaluation Results
The system was evaluated using backtesting and Mean Absolute Percentage Error (MAPE).

Utility
MAPE Result
Electricity Prediction	11.16%
Water Prediction	9.14%

These results exceeded the project target of maintaining prediction error below 20%.

🎓 Research Contribution
This project contributes a localized intelligent utility management solution specifically designed for Sri Lankan consumers by integrating:

Local tariff-aware forecasting
Multi-utility integration
Statistical anomaly detection
Financial planning tools
Consumption analytics
Unlike existing international platforms, the system supports Sri Lankan billing structures and utility pricing models.

🔮 Future Improvements
Smart meter integration
Mobile application development
AI-powered recommendation engine
Advanced deep learning forecasting models
Real-time utility consumption tracking
Enhanced anomaly detection using Isolation Forest and LSTM models
👤 Author
Delpe Silva
BSc (Hons) Software Engineering
Plymouth University

👩‍🏫 Supervisor
Ms. Thisarani Wickramasinghe
