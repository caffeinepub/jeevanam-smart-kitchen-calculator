# Specification

## Summary
**Goal:** Fix admin authentication for raw material operations so authenticated admins can add, update, and delete raw materials without errors.

**Planned changes:**
- Fix the backend authentication check in addRawMaterial, updateRawMaterial, and deleteRawMaterial functions to properly recognize the authenticated admin principal
- Ensure the admin validation logic correctly identifies logged-in Internet Identity principals

**User-visible outcome:** Authenticated admins can successfully add, update, and delete raw materials without encountering "Admin not set up yet" error messages.
