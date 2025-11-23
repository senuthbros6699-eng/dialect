import { createClient } from '@supabase/supabase-js'

// Notice the quotes '' around the URL below
const supabaseUrl = 'https://nknmmrzrzyfgintyeqpd.supabase.co'

// Notice the quotes '' around the Key below
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbm1tcnpyenlmZ2ludHllcXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Mjg0MjUsImV4cCI6MjA3OTQwNDQyNX0.R6OLqZ-sfqeBUeXr8rUKbHvqNH80_Qnuss3K-MuUx0M'

export const supabase = createClient(supabaseUrl, supabaseKey)