# Testing Guide

This document outlines the testing strategy for our application, including the model creation and image generation workflow.

## Test Types

We have several types of tests:

1. **Unit Tests**: Using Jest to test individual components and functions
2. **Component Tests**: Using React Testing Library to test UI components
3. **End-to-End Tests**: Using Playwright to test user flows in a browser
4. **Workflow Tests**: Testing specific critical user flows like model creation

## Model Creation Workflow Testing

### Automated Mock Test

The mock test verifies the overall flow without making real API calls:

```bash
npm run test:workflow
```

This test:
- Mocks all API responses
- Verifies all steps in the workflow
- Completes in a few seconds
- Doesn't require Modal or Python dependencies

### Manual Integration Test

For testing the actual API with real dependencies:

```bash
npm run test:model-creation
```

This test:
- Makes real API calls to your backend
- Creates a real model in your database
- Monitors training progress
- Generates an image
- Cleans up test data when complete

Requirements for running the manual test:
- Next.js server running (`npm run dev` in separate terminal)
- Environment variables configured in `.env.local`
- Supabase access
- Modal set up and working

## Test Images

To use custom test images:

1. Place test images in the `scripts/test-images` directory
2. Images should be JPG, PNG, or JPEG format
3. The test will randomly select from available images

## Troubleshooting

If tests fail:

1. Check console output for error messages
2. Verify environment variables are set correctly
3. Ensure dependencies are installed (`npm install`)
4. For Modal/Python issues, check Modal installation and Python environment

## Running Individual Tests

To run specific tests:

```bash
# Run specific Jest test
npm test -- path/to/test.js

# Run Playwright tests
npm run test:e2e

# Run Playwright tests with UI
npm run test:e2e:ui
``` 