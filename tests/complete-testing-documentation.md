# Testing Documentation for Smart Agri System

## 1. Introduction

Testing is a critical part of software development because it verifies whether the implemented system behaves according to its intended requirements. In the Smart Agri System, testing was especially important because the project combines multiple layers of functionality:

- A **frontend** built in React for user interaction
- A **backend** built in Node.js and Express for authentication, field management, crop planning, weather, reports, and notifications
- A **machine learning module** for crop recommendation and dataset generation
- Deployment on **Vercel** for the frontend and **Render** for the backend

Because the project is a full-stack agricultural decision-support platform, testing had to cover UI behavior, API communication, backend business logic, ML prediction logic, and deployment readiness. The goal of this testing effort was not only to check whether the system runs, but also to confirm that the platform produces correct, consistent, and explainable output for farmers and researchers.

This document presents the complete testing approach used for the project, including frontend testing, backend testing, and machine learning testing. It also summarizes the test environment, test strategy, sample test cases, and the outcome of the executed tests.

## 2. Testing Objectives

The main objectives of testing were:

1. To verify that the frontend renders the correct screens and uses the correct API configuration.
2. To confirm that the backend routes respond correctly under both valid and invalid conditions.
3. To validate the crop planning logic used for recommendations and rotation plans.
4. To ensure that the ML utilities generate valid crop datasets and return meaningful crop predictions.
5. To confirm that the deployed backend on Render can be reached successfully from the frontend.
6. To ensure that the application handles missing input, invalid input, and unauthorized access gracefully.

The project was tested using a mix of manual and automated techniques so that both user-facing behavior and internal logic were checked.

## 3. Test Environment

The testing was performed in the same development environment used for implementation, along with the deployed cloud environment.

### 3.1 Development Environment

- Operating System: macOS
- Frontend Runtime: React 19
- Backend Runtime: Node.js and Express
- ML Runtime: Python
- Database: MongoDB

### 3.2 Deployment Environment

- Frontend Hosting: Vercel
- Backend Hosting: Render
- Database Hosting: MongoDB Atlas

### 3.3 Testing Tools

- React Testing Library
- Jest
- Node.js built-in test runner
- Python `unittest`
- Browser-based manual verification
- HTTP requests to deployed endpoints

## 4. Testing Strategy

The testing strategy was divided into three major parts: frontend testing, backend testing, and ML testing.

### 4.1 Frontend Testing Strategy

Frontend testing focused on verifying the user interface and configuration-driven behavior. The main goal was to make sure the React application builds correct API URLs, uses the correct backend address from the environment, and keeps the UI logic consistent with the deployment setup.

The frontend test suite validates:

- API base URL selection from `REACT_APP_API_BASE_URL`
- URL generation for backend endpoints
- Asset URL normalization

This is important because the frontend is deployed separately on Vercel, and the backend URL must be injected through environment variables rather than hardcoded into the source code.

### 4.2 Backend Testing Strategy

Backend testing focused on the business rules that drive crop planning. The backend contains the recommendation and rotation logic that supports farmers in making agronomic decisions. Testing ensured that:

- The crop recommendation engine ranks crops correctly based on field conditions
- The crop rotation planner avoids repeating crops that should not follow each other
- Protected endpoints return proper authorization errors when no token is supplied
- Validation errors are returned when required fields are missing

The backend suite uses Node’s built-in test runner, which makes the tests simple to execute without additional testing infrastructure.

### 4.3 ML Testing Strategy

ML testing focused on the crop recommendation pipeline, dataset generation, and input validation. Since this project includes a machine learning workflow, it was necessary to verify that:

- The synthetic dataset generator creates the correct number of rows and columns
- The generated data stays within valid agronomic ranges
- The crop prediction helper rejects invalid inputs
- The prediction helper returns ranked crop candidates with confidence values

These tests were written in Python using the standard `unittest` module so they can run without extra test dependencies.

## 5. Frontend Testing

The frontend is responsible for displaying the application interface and communicating with the backend. In this project, frontend testing was primarily aimed at ensuring the UI connects correctly to the backend and that environment-based configuration works properly.

### 5.1 Frontend Test File

- [`frontend/src/App.test.js`](../frontend/src/App.test.js)

### 5.2 What Was Tested

The frontend test file verifies two main helper behaviors:

1. **API URL construction**
   - Confirms that `apiUrl()` builds full backend endpoints using the configured base URL.
   - This ensures the frontend can call the deployed Render backend when `REACT_APP_API_BASE_URL` is set.

2. **Asset URL normalization**
   - Confirms that `assetUrl()` converts relative and absolute upload paths into a consistent backend URL.
   - This is useful for uploaded files and other assets served by the backend.

### 5.3 Why Frontend Testing Matters

Without frontend testing, a deployment might succeed but the app could still fail at runtime because the frontend is calling the wrong backend URL. That risk is especially high in a split deployment setup like Vercel + Render. Testing the API helper ensures the frontend remains portable across environments.

### 5.4 Frontend Test Result

The frontend tests passed successfully.

## 6. Backend Testing

The backend contains the core application logic for field management, crop planning, authentication, and notifications. For this project, the most important backend logic is the crop planning service because it powers the recommendation and rotation features.

### 6.1 Backend Test File

- [`backend/test/cropPlanningService.test.js`](../backend/test/cropPlanningService.test.js)

### 6.2 What Was Tested

The backend tests cover the crop planning service in two key areas:

1. **Crop recommendation ranking**
   - A realistic field profile is passed into the recommendation engine.
   - The test verifies that the engine returns a sorted list of crops.
   - It also checks that the top result matches the expected agronomic conditions.

2. **Crop rotation planning**
   - The test checks that the rotation plan avoids repeating the same crop.
   - It confirms that alternate crop options are suggested.
   - It verifies that the returned plan includes explanatory notes.

### 6.3 Additional Backend Behavior Verified Manually

Beyond the automated tests, the backend was also verified using live requests against the Render deployment. Those checks confirmed:

- Protected endpoints reject unauthorized requests
- Validation errors are returned correctly for missing fields
- The service responds successfully when the correct route and token are used

### 6.4 Why Backend Testing Matters

The backend logic is the foundation of the application’s agronomic intelligence. If crop ranking or rotation rules are wrong, the app could display misleading advice to users. The backend tests help ensure that the crop planning output remains stable and explainable.

### 6.5 Backend Test Result

The backend tests passed successfully.

## 7. Machine Learning Testing

The machine learning component supports crop recommendation by generating a high-quality dataset and using a trained model pipeline for inference. Because ML behavior can be difficult to inspect manually, testing is important for confirming both data quality and prediction logic.

### 7.1 ML Test Files

- [`tests/ml/test_generate_crop_dataset.py`](./ml/test_generate_crop_dataset.py)
- [`tests/ml/test_predict_crop.py`](./ml/test_predict_crop.py)

### 7.2 Dataset Generation Testing

The dataset generator creates a synthetic crop recommendation dataset with the expected number of samples and classes. The ML tests verify:

- The dataframe contains the expected number of rows
- The class count matches the intended crop set
- Required columns are present
- Generated values remain within valid ranges

This matters because the quality of the trained model depends on the quality and consistency of the dataset.

### 7.3 Prediction Helper Testing

The prediction helper is tested for:

- Input validation
- Correct handling of valid agronomic values
- Rejection of invalid pH values or other out-of-range data
- Ranked crop output from the model wrapper
- Confidence values for the top predictions

### 7.4 Why ML Testing Matters

Machine learning models can appear to work even when the input pipeline is incorrect. For example, a bad feature order or invalid input range can produce misleading predictions. These tests help ensure the model wrapper behaves correctly before the result reaches the user interface.

### 7.5 ML Test Result

The ML tests passed successfully.

## 8. Manual and Deployment Testing

In addition to automated tests, the system was manually verified in the browser and against live deployed services.

### 8.1 Manual Tests Performed

- Farmer signup and login
- Researcher signup and login
- Add Field modal interaction
- Crop recommendation page loading
- Crop rotation page loading
- Sidebar navigation
- Error handling for missing required fields
- Unauthorized access to protected APIs

### 8.2 Deployment Verification

The backend deployed on Render was tested directly through API requests. The service returned expected responses for:

- Public routes
- Protected routes without a token
- Validation-based errors

The frontend was configured to use the Render backend URL through environment variables, which ensures that production deployment remains stable and not tied to hardcoded local addresses.

## 9. Sample Functional Test Cases

The following sample cases summarize the most important checks:

| ID | Area | Scenario | Expected Result | Outcome |
| --- | --- | --- | --- | --- |
| TC-01 | Frontend | Use configured API base URL | Frontend calls the correct backend | Passed |
| TC-02 | Frontend | Normalize upload asset paths | Both path styles resolve correctly | Passed |
| TC-03 | Backend | Rank crops for a clay field | Paddy ranks highly | Passed |
| TC-04 | Backend | Generate crop rotation plan | Alternate crops are suggested | Passed |
| TC-05 | Backend | Call protected route without token | Return `401 No token provided` | Passed |
| TC-06 | ML | Generate crop dataset | Correct rows and columns are created | Passed |
| TC-07 | ML | Validate prediction inputs | Out-of-range inputs are rejected | Passed |
| TC-08 | ML | Predict crop recommendation | Top crop and confidence are returned | Passed |

## 10. Test Execution Summary

The complete test suite was executed successfully:

- Frontend tests: Passed
- Backend tests: Passed
- ML tests: Passed
- Manual browser checks: Passed
- Deployment checks: Passed

The combined testing showed that the system is stable across the UI, backend logic, and ML pipeline. This gives confidence that the Smart Agri System is suitable for deployment and demonstration.

## 11. Conclusion

The Smart Agri System was tested as a full-stack and ML-enabled application. The frontend tests ensured that the React application correctly uses deployment-time configuration. The backend tests verified the agronomic logic used for crop recommendation and rotation. The ML tests confirmed that dataset generation and prediction functions behave correctly and stay within valid input bounds.

Overall, the testing process demonstrated that the application is reliable, modular, and ready for deployment. The final test suite provides direct evidence that the system’s major components work together as intended to support farmers with actionable agricultural guidance.

