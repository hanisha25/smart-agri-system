# Running the Test Suite

## Frontend

From the `frontend` directory:

```bash
npm test -- --runInBand
```

## Backend

From the `backend` directory:

```bash
npm test
```

## ML Tests

From the repository root:

```bash
python -m unittest discover -s tests/ml -p "test_*.py"
```

## Full Validation

Recommended order:

1. Run backend unit tests
2. Run frontend tests
3. Run ML unit tests
4. Verify deployed backend endpoints manually

