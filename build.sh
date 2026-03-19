#!/bin/bash
# Replace placeholders with environment variables at build time
sed -i "s|__SUPABASE_URL__|${SUPABASE_URL}|g" js/config.js
sed -i "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" js/config.js
