"use client";

import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  autoHideDuration?: number; // In milliseconds
}

export function ErrorBanner({ 
  message, 
  onDismiss, 
  autoHideDuration = 5000 
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(!!message);

  // Reset visibility when message changes
  useEffect(() => {
    setVisible(!!message);
    
    // Auto-hide after duration if specified
    if (message && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onDismiss]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  onDismiss();
                }}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <span className="h-5 w-5" aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
