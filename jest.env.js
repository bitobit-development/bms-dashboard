// Set environment variables BEFORE any modules are imported
// This file runs before setupFilesAfterEnv

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_STACK_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY = 'test-client-key'
process.env.STACK_SECRET_SERVER_KEY = 'test-secret-key'
