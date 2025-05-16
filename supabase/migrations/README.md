
# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Initial Schema (20250516000000_create_base_schema.sql)

This migration creates the core database structure for the application:

### Tables
- `users`: Stores user roles and basic information
- `profiles`: Stores user profile information
- `subscribers`: Stores subscription information

### Types
- `app_role`: An enum type with values 'administrator', 'support', and 'user'

### Functions and Triggers
- `get_user_role`: Gets a user's role
- `handle_new_user`: Creates a record in the users table when a new auth user is created
- `create_profile_for_user`: Creates a profile when a new auth user is created
- Triggers that connect auth.users to our custom tables

### Default Behavior
- All new users are assigned the 'user' role by default

## How to Run Migrations

When remixing this project:

1. Go to the Supabase SQL Editor
2. Create a new query
3. Copy and paste the content of the migration file
4. Run the query

Alternatively, you can use the Supabase CLI to run migrations automatically.
