# Functional Test Cases

| ID | Module | Test Scenario | Expected Result | Status |
| --- | --- | --- | --- | --- |
| TC-01 | Authentication | Sign up as farmer with all required fields | Account is created successfully | Passed |
| TC-02 | Authentication | Sign up without required farmer fields | Validation message is shown and request is blocked | Passed |
| TC-03 | Authentication | Login with valid credentials | JWT token is returned and dashboard opens | Passed |
| TC-04 | Field Management | Add a field with required details | Field is saved successfully | Passed |
| TC-05 | Field Management | Add a field with missing required details | API returns `400` with validation message | Passed |
| TC-06 | Crop Planning | Open crop recommendation screen | Ranked recommendations are shown for each field | Passed |
| TC-07 | Crop Rotation | Open crop rotation screen | Rotation plan and next crop options are shown | Passed |
| TC-08 | Crop Planning | Request ML crop recommendation | ML or fallback recommendation is returned | Passed |
| TC-09 | Protected Routes | Access protected API without JWT | API returns `401 No token provided` | Passed |
| TC-10 | Deployment | Call Render backend from frontend URL | Backend API responds successfully | Passed |

