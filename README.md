# Mini_Expense_Manager

# Expense Tracker Application

## 📌 Overview
This is a full-stack Expense Tracker application that allows users to upload expenses via CSV, categorize them automatically using rule-based logic, and detect anomalies based on spending patterns.

---

## 🚀 Setup Instructions

### Backend (Spring Boot)

1. Clone the repository
2. Open project in IntelliJ / VS Code
3. Configure database in `application.properties`
4. Run:
   mvn clean install
   mvn spring-boot:run

Backend runs on:
http://localhost:8081

---

### Frontend (React)

1. Navigate to frontend folder
2. Install dependencies:
   npm install
3. Start the app:
   npm start

Frontend runs on:
http://localhost:3000

---

## 🛠 Technologies Used

### Backend
- Java 17
- Spring Boot
- Spring Security (JWT Authentication)
- Spring Data JPA
- Hibernate
- MySQL
- Apache Commons CSV
- Lombok

### Frontend
- React.js
- Axios
- Bootstrap / CSS

---

## 📂 Features

- User Registration & Login (JWT-based authentication)
- CSV Upload for expenses
- Automatic category detection
- Rule-based anomaly detection
- Expense listing per user
- Secure API endpoints

---

## 🧠 Assumptions Made

- CSV file contains headers:
  expenseDate, amount, vendorName, description
- Date format is: yyyy-MM-dd
- Category is derived from vendor name
- Anomaly is detected based on high amount threshold per category
- Each expense belongs to a logged-in user

