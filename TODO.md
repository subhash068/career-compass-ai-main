# Admin Login Redirect Fix - TODO

## Steps to Complete:

### 1. Fix AuthWrapper.tsx
- [x] Remove automatic redirect that overrides login page's redirect decision
- [x] Add check to prevent redirect if user just logged in (came from /login)
- [x] Ensure AuthWrapper only redirects from root path `/`

### 2. Update Login.tsx
- [x] Add setTimeout to ensure navigate happens after AuthContext updates
- [x] Add better debug logging to trace the redirect flow


### 3. Testing
- [ ] Test admin login redirects to `/admin`
- [ ] Test regular user login redirects to `/dashboard`
- [ ] Test AuthWrapper still redirects from root `/` correctly
