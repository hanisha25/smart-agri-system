# Testing Report

## 1. Testing Objective

The objective of testing was to verify that the Smart Agri System works correctly as a full-stack agricultural decision-support platform. The system combines:

- A React frontend for farmer and researcher workflows
- An Express and MongoDB backend for authentication, field management, notifications, and crop planning
- Rule-based crop recommendation and rotation logic
- ML-assisted crop recommendation support

Testing focused on correctness, reliability, role-based access control, and environment-based configuration for deployment.

## 2. Testing Scope

The following areas were tested:

- User authentication and role selection
- Field registration and validation
- Crop recommendation output
- Crop rotation output
- API helper configuration in the frontend
- Backend agronomic scoring and rotation logic
- Protected API route behavior without JWT tokens
- Deployed backend reachability on Render

## 3. Testing Strategy

The project was tested using three complementary approaches.

### 3.1 Manual Testing

Manual testing was performed through the browser and API requests to verify:

- Signup and login flows
- Sidebar navigation
- Add Field modal behavior
- Crop recommendation screen
- Crop rotation screen
- Error handling for missing data and unauthorized requests

### 3.2 Automated Frontend Testing

Frontend tests were written with React Testing Library and Jest to validate:

- API URL generation from `REACT_APP_API_BASE_URL`
- Asset URL normalization

### 3.3 Automated Backend Testing

Backend tests were written with Node.js built-in test runner to validate:

- Crop recommendation ranking for a realistic field profile
- Rotation plan generation logic

### 3.4 Automated ML Testing

ML tests were written with Python's `unittest` framework to validate:

- Crop dataset generation
- Input validation for the crop prediction helper
- Ranked crop prediction output from the model wrapper

## 4. Test Environment

- Frontend: React 19
- Backend: Node.js + Express
- Database: MongoDB
- Deployment backend: Render
- Deployment frontend: Vercel

## 5. Automated Test Coverage

### 5.1 Frontend Test Coverage

File:

- [`frontend/src/App.test.js`](../frontend/src/App.test.js)

Covered behavior:

- Confirms the frontend uses the configured API base URL
- Confirms API paths are built correctly
- Confirms asset paths are normalized correctly

### 5.2 Backend Test Coverage

File:

- [`backend/test/cropPlanningService.test.js`](../backend/test/cropPlanningService.test.js)

Covered behavior:

- Validates crop recommendation ranking for a clay soil field with irrigation and soil test data
- Validates crop rotation planning for repeated crops
- Confirms next-crop suggestions are produced

### 5.3 ML Test Coverage

Files:

- [`tests/ml/test_generate_crop_dataset.py`](./ml/test_generate_crop_dataset.py)
- [`tests/ml/test_predict_crop.py`](./ml/test_predict_crop.py)

Covered behavior:

- Confirms the generated crop dataset has the expected shape and columns
- Confirms generated feature values stay within agronomic bounds
- Confirms valid and invalid prediction inputs are handled correctly
- Confirms the prediction helper returns the top-ranked crop and confidence values

## 6. Sample Test Cases

### Test Case 1: Frontend API URL Construction

- Input: `REACT_APP_API_BASE_URL`
- Expected: API calls should use the configured backend URL
- Result: Passed

### Test Case 2: Frontend Asset URL Normalization

- Input: `uploads/field.jpg` and `/uploads/field.jpg`
- Expected: Both should resolve to the same absolute backend asset URL
- Result: Passed

### Test Case 3: Crop Recommendation Ranking

- Input: clay soil, canal irrigation, kharif season, moderate NPK, pH 6.2
- Expected: Paddy should rank highly because the field conditions match the crop profile
- Result: Passed

### Test Case 4: Crop Rotation Planning

- Input: current crop paddy and last crop paddy
- Expected: Rotation plan should avoid repeating the same crop and suggest alternate options
- Result: Passed

### Test Case 5: Protected Backend Route Without Token

- Input: request to protected route without JWT
- Expected: `401 No token provided`
- Result: Passed

### Test Case 6: Field Validation

- Input: missing field name, crop name, district, or village
- Expected: `400` response with validation message
- Result: Passed

## 7. Deployment Verification

The backend deployed on Render was verified with live requests. The service responded correctly to protected and validation-based routes, confirming that:

- The Express application is running
- API routes are reachable
- Middleware protection is active
- Validation messages are returned correctly

## 8. Test Results Summary

- Frontend automated tests: Passed
- Backend automated tests: Passed
- ML automated tests: Passed
- Manual browser/API checks: Passed
- Render deployment checks: Passed

## 9. Conclusion

Testing confirmed that the Smart Agri System behaves correctly across frontend, backend, and rule-based planning logic. The system is stable for deployment because its major workflows were validated, and the environment-based frontend configuration supports separate deployment of the frontend on Vercel and backend on Render.
