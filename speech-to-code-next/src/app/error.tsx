'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Something went wrong!
        </h1>
        
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred while processing your request. Please try again.
        </p>
        
        {error.message && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error details: {error.message}
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="min-w-[120px]"
          >
            Try again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="min-w-[120px]"
          >
            Go home
          </Button>
        </div>
        
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}