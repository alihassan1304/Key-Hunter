# Supabase Schema Notes

Applied migrations:

1. `create_key_hunter_core_tables`
2. `tighten_function_permissions`
3. `revoke_public_function_execute`

Security advisor status after migrations: no active warnings.

Public leaderboard reads are allowed. Player inventory, progress, and settings are readable and writable only by the signed-in owner. Ranked score inserts require the authenticated user id to match the submitted score owner.
