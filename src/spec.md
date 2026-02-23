# Specification

## Summary
**Goal:** Fix service unavailable and connection errors in the live deployment by adding robust error handling, retry logic, and health monitoring.

**Planned changes:**
- Add comprehensive error handling and retry logic with exponential backoff to all backend query hooks
- Enhance the useBackendHealth hook to detect and display connection errors prominently with recovery status
- Add a global error boundary component that catches authentication and connection errors during initial app load
- Add a health check endpoint in the backend that returns canister status without requiring authentication

**User-visible outcome:** Users will see informative error messages when the service is temporarily unavailable, automatic recovery when the backend becomes available, and clear instructions on what to do during outages. The application will gracefully handle connection failures and canister stopped errors with automatic retries.
