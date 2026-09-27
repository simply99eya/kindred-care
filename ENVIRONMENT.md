# Environment setup reference

For a self-managed local run, place the following placeholders in your private environment configuration. Do not commit credential files or real secrets. The managed WebDev project already injects its configured database, OAuth, and storage credentials.

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=replace-with-a-long-random-secret

# OAuth provider settings
VITE_APP_ID=your-manus-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Care Space Owner

# Server-only access for secure profile photo storage
BUILT_IN_FORGE_API_URL=https://your-forge-api.example
BUILT_IN_FORGE_API_KEY=replace-with-server-side-key
```

Do not put database passwords, session secrets, or storage keys in any `VITE_*` variable. No AI model key is needed for the current, explicitly labeled demo companion.
