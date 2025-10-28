# Error Handling System

A comprehensive error handling system with boundaries, loading states, and graceful degradation for the StartSpooling application.

## Features

### 🛡️ Error Boundaries
- **Global Error Boundary** (`/app/error.tsx`): Catches page-level errors with minimal UI
- **Graceful Fallback**: Shows user-friendly error message with retry option
- **Error Logging**: Logs errors for debugging (console in dev, service in prod)

### ⏳ Loading States
- **Global Loading** (`/app/loading.tsx`): Shows SpoolAnimation in idle state
- **Loading Spinner** (`/components/LoadingSpinner.tsx`): Reusable spinner with size variants
- **Form Loading**: Integrated loading states in all forms

### 🚨 Error Messages
- **ErrorMessage Component** (`/components/ErrorMessage.tsx`): Reusable error display
- **Auto-dismiss**: Optional auto-dismiss after 5 seconds
- **Slide Animations**: Smooth slide-in/out animations
- **Retry Actions**: Built-in retry functionality for recoverable errors

### 📱 Offline Detection
- **OfflineBanner** (`/components/OfflineBanner.tsx`): Shows offline status
- **Form Disabling**: Automatically disables forms when offline
- **Reconnection**: Re-enables functionality when back online

### 🔧 Error Handling Hook
- **useErrorHandling** (`/lib/useErrorHandling.ts`): Centralized error state management
- **Async Operations**: Handles async operations with automatic error catching
- **Error Types**: Categorized error types (network, validation, server, etc.)

## Components

### ErrorMessage
```tsx
<ErrorMessage
  message="connection issue."
  type="network"
  onRetry={() => retryAction()}
  onDismiss={() => clearError()}
  autoDismiss={true}
  dismissAfter={5000}
/>
```

### LoadingSpinner
```tsx
<LoadingSpinner 
  size="md" 
  label="loading..." 
  className="my-4"
/>
```

### OfflineBanner
```tsx
<OfflineBanner />
```

### useErrorHandling Hook
```tsx
const { error, isLoading, setError, clearError, handleAsync } = useErrorHandling()

// Handle async operations
await handleAsync(
  async () => {
    const response = await fetch('/api/data')
    return response.json()
  },
  {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.log('Error:', error),
    errorType: 'network'
  }
)
```

## Error Types

### Network Errors
- **Message**: "connection issue."
- **Retryable**: Yes
- **Auto-dismiss**: No

### Timeout Errors
- **Message**: "taking too long. retry?"
- **Retryable**: Yes
- **Auto-dismiss**: No

### Validation Errors
- **Message**: "invalid input."
- **Retryable**: No
- **Auto-dismiss**: Yes (5 seconds)

### Server Errors
- **Message**: "server error. try again."
- **Retryable**: Yes
- **Auto-dismiss**: No

### Client Errors
- **Message**: "something broke. we're on it."
- **Retryable**: No
- **Auto-dismiss**: No

## Enhanced Forms

### EmailForm
- ✅ Offline detection
- ✅ Loading states with spinner
- ✅ Comprehensive error handling
- ✅ Auto-clear errors on input
- ✅ Retry functionality

### WaitlistForm
- ✅ Offline detection
- ✅ Loading states with spinner
- ✅ Comprehensive error handling
- ✅ Auto-clear errors on input
- ✅ Retry functionality

### Verify Page
- ✅ Offline detection
- ✅ Loading states with spinner
- ✅ Comprehensive error handling
- ✅ Account lockout handling
- ✅ Code expiry handling
- ✅ Attempt tracking

## Styling

### Error States
- **Network**: Red border with red background
- **Timeout**: Yellow border with yellow background
- **Validation**: Red border with red background
- **Server**: Red border with red background
- **Client**: Gray border with gray background

### Loading States
- **Electric Blue**: `#00D9FF` color scheme
- **Size Variants**: `sm`, `md`, `lg`
- **Accessibility**: Screen reader friendly

### Animations
- **Slide In**: `animate-slide-in` class
- **Slide Out**: `animate-slide-out` class
- **Smooth Transitions**: 300ms duration

## Accessibility

- **Screen Reader Support**: All components include proper ARIA labels
- **Focus Management**: Proper focus handling in error states
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: High contrast error messages

## Usage Examples

### Basic Error Handling
```tsx
import { useErrorHandling } from '@/lib/useErrorHandling'
import ErrorMessage from '@/components/ErrorMessage'

function MyComponent() {
  const { error, isLoading, handleAsync } = useErrorHandling()

  const handleSubmit = async () => {
    await handleAsync(
      async () => {
        const response = await fetch('/api/submit')
        if (!response.ok) throw new Error('Failed to submit')
        return response.json()
      },
      {
        onSuccess: (data) => {
          console.log('Success:', data)
        },
        errorType: 'network'
      }
    )
  }

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
      {error && (
        <ErrorMessage
          message={error.message}
          type={error.type}
          onRetry={error.retryable ? handleSubmit : undefined}
        />
      )}
    </div>
  )
}
```

### Offline Detection
```tsx
import { useOfflineDetection } from '@/components/OfflineBanner'

function MyComponent() {
  const { isOffline } = useOfflineDetection()

  return (
    <div>
      <button disabled={isOffline}>
        {isOffline ? 'Offline' : 'Submit'}
      </button>
      {isOffline && <p>You're offline</p>}
    </div>
  )
}
```

## Error Logging

### Development
- Errors logged to console with full context
- Error IDs for tracking
- Stack traces included

### Production
- Errors sent to error tracking service (e.g., Sentry)
- Sanitized error messages
- Performance monitoring

## Best Practices

1. **Never show raw errors** to users
2. **Always provide actionable next steps**
3. **Use appropriate error types** for better UX
4. **Implement retry logic** for recoverable errors
5. **Handle offline states** gracefully
6. **Log errors** for debugging
7. **Test error scenarios** thoroughly

## File Structure

```
lib/
├── error-types.ts          # TypeScript types and utilities
├── useErrorHandling.ts     # Error handling hook
app/
├── error.tsx              # Global error boundary
├── loading.tsx            # Global loading state
components/
├── ErrorMessage.tsx       # Reusable error component
├── LoadingSpinner.tsx     # Loading spinner component
├── OfflineBanner.tsx      # Offline detection banner
```

## Integration

The error handling system is automatically integrated into:
- ✅ Main layout with OfflineBanner
- ✅ EmailForm component
- ✅ WaitlistForm component
- ✅ Verify page
- ✅ All async operations

## Testing

To test the error handling system:

1. **Network Errors**: Disable network in dev tools
2. **Timeout Errors**: Add delays to API responses
3. **Validation Errors**: Submit invalid data
4. **Server Errors**: Return 500 status codes
5. **Offline Detection**: Toggle network connection

## Future Enhancements

- [ ] Error analytics dashboard
- [ ] Custom error boundaries for specific routes
- [ ] Error recovery strategies
- [ ] User feedback collection
- [ ] Error rate monitoring
