# Specification

## Summary
**Goal:** Fix the canister stopped error that prevents raw material operations from completing after deployment.

**Planned changes:**
- Investigate and resolve backend canister停止 state during raw material operations
- Add backend initialization checks and error recovery mechanisms for admin setup
- Improve frontend error handling to detect canister stopped errors and provide user-friendly guidance

**User-visible outcome:** Raw material operations complete successfully without canister errors, and users receive clear feedback if transient issues occur.
