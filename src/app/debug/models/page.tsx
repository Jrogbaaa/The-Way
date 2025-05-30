'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';

export default function ModelsDebugPage() {
  const { user, loading } = useAuth();
  const [modelData, setModelData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>({});
  const [requestInfo, setRequestInfo] = useState<any>({});
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Gather browser information
    const info = {
      userAgent: navigator.userAgent,
      browserName: getBrowserName(),
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof(Storage) !== "undefined",
      sessionStorage: typeof(Storage) !== "undefined",
      fetch: typeof(fetch) !== "undefined",
      abortController: typeof(AbortController) !== "undefined",
      url: window.location.href,
      origin: window.location.origin,
      cookies: document.cookie ? document.cookie.split(';').map(c => c.trim()) : [],
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    };
    setBrowserInfo(info);
  }, []);

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Firefox')) return 'Firefox/Gecko';
    if (userAgent.includes('Chrome')) return 'Chrome/Chromium';
    if (userAgent.includes('Safari')) return 'Safari/WebKit';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const testModelsAPI = async () => {
    setIsLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting API test...');
      
      // Create abort controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const requestDetails = {
        url: '/api/modal/user-models',
        method: 'GET',
        credentials: 'include' as RequestCredentials,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      };
      
      setRequestInfo({
        ...requestDetails,
        startTime: new Date(startTime).toISOString(),
        browser: getBrowserName()
      });
      
      console.log('📡 Making request with:', requestDetails);
      
      const response = await fetch('/api/modal/user-models', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      console.log('📋 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: endTime - startTime
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data parsed successfully:', data);
      
      setModelData({
        ...data,
        responseTime: endTime - startTime,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseStatus: response.status
      });
      
    } catch (error) {
      const endTime = Date.now();
      console.error('❌ Request failed:', error);
      
      const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        duration: endTime - startTime,
        isAbortError: error instanceof Error && error.name === 'AbortError',
        isNetworkError: error instanceof Error && error.message.includes('Failed to fetch'),
        isTimeoutError: error instanceof Error && error.name === 'TimeoutError'
      };
      
      setError(JSON.stringify(errorInfo, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const testConsoleErrors = () => {
    // Check for any console errors
    const originalError = console.error;
    const errors: string[] = [];
    
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError(...args);
    };
    
    // Test some potential problem areas
    try {
      // Test fetch
      console.log('Testing fetch availability:', typeof fetch);
      
      // Test AbortController
      console.log('Testing AbortController:', typeof AbortController);
      
      // Test localStorage
      console.log('Testing localStorage:', typeof localStorage);
      
      // Test sessionStorage
      console.log('Testing sessionStorage:', typeof sessionStorage);
      
      // Test cookies
      console.log('Testing cookies:', document.cookie.length > 0);
      
    } catch (e) {
      console.error('Browser compatibility test failed:', e);
    }
    
    console.error = originalError;
    return errors;
  };

  const testSessionAPI = async () => {
    try {
      console.log('🔍 Testing session API...');
      
      const response = await fetch('/api/debug/session', {
        method: 'GET',
        credentials: navigator.userAgent.includes('Firefox') ? 'same-origin' : 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('🔍 Session API response:', data);
      setSessionData(data);
      
    } catch (error) {
      console.error('❌ Session API test failed:', error);
      setSessionData({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Models API Debug Page</h1>
        
        <div className="grid gap-6">
          {/* Browser Information */}
          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
              <CardDescription>Current browser capabilities and environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Browser:</span>
                  <Badge variant={browserInfo.browserName?.includes('Firefox') ? 'destructive' : 'default'}>
                    {browserInfo.browserName}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cookies Enabled:</span>
                  <Badge variant={browserInfo.cookiesEnabled ? 'default' : 'destructive'}>
                    {browserInfo.cookiesEnabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Fetch API:</span>
                  <Badge variant={browserInfo.fetch ? 'default' : 'destructive'}>
                    {browserInfo.fetch ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">AbortController:</span>
                  <Badge variant={browserInfo.abortController ? 'default' : 'destructive'}>
                    {browserInfo.abortController ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">LocalStorage:</span>
                  <Badge variant={browserInfo.localStorage ? 'default' : 'destructive'}>
                    {browserInfo.localStorage ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">User Agent</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {browserInfo.userAgent}
                </pre>
              </details>
              
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Current Cookies ({browserInfo.cookies?.length || 0})</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                  {browserInfo.cookies?.join('\n') || 'No cookies'}
                </pre>
              </details>
            </CardContent>
          </Card>

          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Current user session information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Loading:</span>
                  <Badge variant={loading ? 'secondary' : 'default'}>
                    {loading ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <Badge variant={user ? 'default' : 'secondary'}>
                    {user ? `${user.email || user.name || 'Authenticated'}` : 'Not authenticated'}
                  </Badge>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Frontend User ID:</span>
                      <Badge variant="outline">{user.id || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Frontend Email:</span>
                      <Badge variant="outline">{user.email || 'N/A'}</Badge>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4">
                <Button 
                  onClick={testSessionAPI} 
                  variant="outline"
                  className="w-full mb-2"
                >
                  Test Backend Session
                </Button>
                
                {sessionData && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Backend Session Data
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                      {JSON.stringify(sessionData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Test Section */}
          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
              <CardDescription>Test the models API endpoint directly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testModelsAPI} 
                disabled={isLoading}
                className="w-full mb-4"
              >
                {isLoading ? 'Testing...' : 'Test Models API'}
              </Button>
              
              {Object.keys(requestInfo).length > 0 && (
                <details className="mb-4">
                  <summary className="cursor-pointer font-medium">Request Details</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(requestInfo, null, 2)}
                  </pre>
                </details>
              )}
              
              {error && (
                <Alert className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    <pre className="text-xs overflow-auto max-h-40">{error}</pre>
                  </AlertDescription>
                </Alert>
              )}
              
              {modelData && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      API request completed in {modelData.responseTime}ms. 
                      Found {modelData.models?.length || 0} models.
                    </AlertDescription>
                  </Alert>
                  
                  <details>
                    <summary className="cursor-pointer font-medium">
                      Response Data ({modelData.models?.length || 0} models)
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60">
                      {JSON.stringify(modelData, null, 2)}
                    </pre>
                  </details>
                  
                  {modelData.models && modelData.models.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Models Summary:</h4>
                      <div className="space-y-1">
                        {modelData.models.slice(0, 5).map((model: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{model.model_name || model.name || `Model ${model.id?.slice(-8)}`}</span>
                            <Badge variant="outline">{model.status}</Badge>
                          </div>
                        ))}
                        {modelData.models.length > 5 && (
                          <div className="text-sm text-gray-500">
                            ... and {modelData.models.length - 5} more models
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Console Test */}
          <Card>
            <CardHeader>
              <CardTitle>Browser Compatibility Test</CardTitle>
              <CardDescription>Run compatibility checks for potential issues</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  const errors = testConsoleErrors();
                  alert(`Compatibility test completed. Check browser console for details. Errors found: ${errors.length}`);
                }}
                variant="outline"
                className="w-full"
              >
                Run Compatibility Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 