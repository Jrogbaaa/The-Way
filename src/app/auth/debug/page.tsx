'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Info, AlertCircle, CheckCircle, Bug } from 'lucide-react';

export default function AuthDebugPage() {
  const { user, loading } = useAuth();
  const [cookieInfo, setCookieInfo] = useState<string[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState<Record<string, string>>({});
  const [tokenInfo, setTokenInfo] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  useEffect(() => {
    // Get cookie information
    if (typeof document !== 'undefined') {
      setCookieInfo(document.cookie.split(';').map(c => c.trim()));
    }
    
    // Get environment information
    setEnvironmentInfo({
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
      'HOSTNAME': typeof window !== 'undefined' ? window.location.hostname : 'Not available',
      'ORIGIN': typeof window !== 'undefined' ? window.location.origin : 'Not available',
      'NODE_ENV': process.env.NODE_ENV || 'Not set',
      'IS_LOCAL': (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')).toString(),
    });
  }, []);
  
  const testCallback = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Check if we can get the session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setTestResult({ success: false, message: `Error: ${error.message}` });
        return;
      }
      
      if (!data.session) {
        setTestResult({ success: false, message: 'No active session found' });
        return;
      }
      
      // Save token info (truncated for security)
      const jwt = data.session.access_token;
      setTokenInfo(`${jwt.substring(0, 10)}...${jwt.substring(jwt.length - 10)}`);
      
      // Test a protected endpoint
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const testUrl = `${appUrl}/api/user/ensure-profile`;
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: `Successfully called ${testUrl} and got status ${response.status}` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `API call failed with status ${response.status}: ${await response.text()}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Exception: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Bug className="mr-2" /> Authentication Debug Page
      </h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" /> Environment Information
            </CardTitle>
            <CardDescription>Configuration values that affect authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto">
              <pre>
                {Object.entries(environmentInfo).map(([key, value]) => (
                  <div key={key} className="mb-1">
                    <span className="font-bold">{key}:</span> {value}
                  </div>
                ))}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" /> Authentication State
            </CardTitle>
            <CardDescription>Current authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading authentication state...</div>
            ) : (
              <div>
                <div className="mb-2">
                  <span className="font-bold">User:</span> {user ? user.email : 'Not authenticated'}
                </div>
                {user && (
                  <div className="mb-2">
                    <span className="font-bold">User ID:</span> {user.id}
                  </div>
                )}
                <Button onClick={testCallback} className="mt-4">
                  Test Authenticated Request
                </Button>
                
                {testResult && (
                  <Alert className={`mt-4 ${testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <AlertCircle className={testResult.success ? 'text-green-600' : 'text-red-600'} />
                    <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
                
                {tokenInfo && (
                  <div className="mt-4">
                    <span className="font-bold">Access Token:</span> <code>{tokenInfo}</code>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" /> Cookies
            </CardTitle>
            <CardDescription>Authentication cookies in browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[300px]">
              {cookieInfo.length > 0 ? (
                <pre>
                  {cookieInfo.map((cookie, index) => (
                    <div key={index} className="mb-1">{cookie}</div>
                  ))}
                </pre>
              ) : (
                <div>No cookies found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 