# Google Vertex AI Imagen: Common Errors and Solutions

This document provides information about common errors encountered when using Google Vertex AI Imagen and their solutions.

## Environment Variable Issues

### Error: Credentials Not Detected

```
Imagen API environment check: { hasCredentials: false, hasProjectId: true, isConfigured: false }
Vertex AI Imagen not configured, using placeholder image
```

### Explanation
The application cannot find the Google Cloud service account credentials file. This happens when the `GOOGLE_APPLICATION_CREDENTIALS` environment variable is not set or points to a file that doesn't exist.

### Solution
1. Make sure you have created a service account and downloaded the JSON key file
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable in your `.env.local` file
3. Verify the path to the credentials file is correct (absolute or relative to project root)
4. Restart your development server after making changes

## Error: Model Not Found

```
Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent: [404 Not Found] models/gemini-pro is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
```

### Explanation
This error occurs because Imagen is not available through the standard Gemini API but requires the Vertex AI API instead. The models have different endpoints and authentication methods.

### Solution
Use the proper Vertex AI client library instead of the Generative AI library. See [IMAGEN_SETUP.md](./IMAGEN_SETUP.md) for detailed setup instructions.

## Error: Authentication Failed

```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

### Explanation
The application cannot find or access the Google Cloud service account credentials needed to authenticate with Vertex AI.

### Solution
1. Make sure you have created a service account and downloaded the JSON key file
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the JSON key file
3. Ensure the service account has the "Vertex AI User" role

## Error: Access Denied

```
Error: 7 PERMISSION_DENIED: The caller does not have permission
```

### Explanation
The service account being used does not have the necessary permissions to access Vertex AI services.

### Solution
1. Go to the Google Cloud Console > IAM & Admin > IAM
2. Find your service account and click "Edit"
3. Add the "Vertex AI User" role
4. If using storage features, also add "Storage Object Viewer"

## Error: API Not Enabled

```
Error: 7 PERMISSION_DENIED: API vertex.googleapis.com has not been used in project PROJECT_ID before or it is disabled.
```

### Explanation
The Vertex AI API is not enabled for your Google Cloud project.

### Solution
1. Go to the Google Cloud Console > APIs & Services > Library
2. Search for "Vertex AI API"
3. Click on the result and click "Enable"

## Error: Billing Not Enabled

```
Error: Billing is required to activate service [aiplatform.googleapis.com]
```

### Explanation
Vertex AI services require billing to be enabled on your Google Cloud project.

### Solution
1. Go to the Google Cloud Console > Billing
2. Link your project to a billing account

## Error: Invalid Model Format

```
Error: 3 INVALID_ARGUMENT: Model format not supported
```

### Explanation
The model format specified in the request is not supported by Vertex AI.

### Solution
Ensure you're using the correct model ID and parameters as specified in the [Vertex AI documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview).

## Error: Rate Limit Exceeded

```
Error: 8 RESOURCE_EXHAUSTED: Resource has been exhausted (e.g. check quota).
```

### Explanation
You have exceeded the rate limits or quotas for your Vertex AI API usage.

### Solution
1. Check your [Google Cloud Console Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Request additional quota if needed
3. Implement rate limiting in your application

## Error: Region Not Available

```
Error: 5 NOT_FOUND: No available runtime found in region: global
```

### Explanation
Vertex AI services may not be available in all regions.

### Solution
Specify a supported region for your Vertex AI requests, such as `us-central1`.

## Error: Environment Variable Path Issues

```
Error: ENOENT: no such file or directory, open '/path/to/credentials.json'
```

### Explanation
The application cannot find the credentials file at the specified path. This could be due to an incorrect path or the file not existing at that location.

### Solution
1. Use an absolute path to your credentials file
2. If using a relative path, make sure it's relative to the project root
3. Verify the file exists at the specified location
4. Check file permissions to ensure the application can read the file

## Google Cloud API Errors

### Quota Exceeded Error

**Error Message**: `Quota exceeded for aiplatform.googleapis.com/generate_content_requests_per_minute_per_project_per_base_model`

**Description**: This error occurs when you've exceeded the free tier quota limits for the Google Vertex AI service. Google places quotas on API usage to prevent abuse and ensure service availability. For the free tier, these quotas are relatively low.

**Solution**:
1. Wait and try again later - quotas typically refresh after a period of time.
2. Request a quota increase:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "IAM & Admin" > "Quotas & System Limits"
   - Find the relevant quota for "Vertex AI API" or "GenerativeAI API"
   - Select the quota and click "Edit Quotas" to request an increase
3. Upgrade to a paid tier if you need more reliable access to the API.

**Common Quota Limits**:
- Requests per minute
- Total requests per day
- Number of images generated per day/month
- Total API calls per project

**Related Error Codes**: 429 Too Many Requests, RESOURCE_EXHAUSTED

## Additional Resources

- [Google Cloud Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vertex AI Error Codes Reference](https://cloud.google.com/apis/design/errors)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)

If you encounter errors not listed here, please consult the [Google Cloud Support](https://cloud.google.com/support) or create an issue in the repository. 