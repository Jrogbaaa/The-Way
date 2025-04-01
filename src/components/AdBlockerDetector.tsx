import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const AdBlockerDetector = () => {
  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const detectAdBlocker = async () => {
      try {
        // Create a "bait" element that ad blockers typically target
        const testElement = document.createElement('div');
        testElement.className = 'adsbox';
        testElement.innerHTML = '&nbsp;';
        document.body.appendChild(testElement);
        
        // Wait a moment for ad blocker to act on the element
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if ad blocker affected the element
        const isBlocked = testElement.offsetHeight === 0 || 
                          testElement.offsetParent === null || 
                          window.getComputedStyle(testElement).display === 'none';
        
        setAdBlockDetected(isBlocked);
        document.body.removeChild(testElement);
        
        // Also try to check by loading a test script that ad blockers typically block
        if (!isBlocked) {
          const testScript = document.createElement('script');
          testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
          testScript.onerror = () => setAdBlockDetected(true);
          testScript.onload = () => document.body.removeChild(testScript);
          document.body.appendChild(testScript);
        }
      } catch (error) {
        console.error('Error detecting ad blocker:', error);
      }
    };

    detectAdBlocker();
  }, []);

  if (adBlockDetected !== true) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4 flex items-start gap-2">
      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-medium">Ad blocker detected</h4>
        <p className="text-sm">
          We've detected that you're using an ad blocker, which may interfere with the image generation functionality. 
          If you experience issues, please try disabling your ad blocker for this site.
        </p>
      </div>
    </div>
  );
};

export default AdBlockerDetector; 