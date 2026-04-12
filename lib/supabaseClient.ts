import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ewmdowzllprospcqtcqb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bWRvd3psbHByb3NwY3F0Y3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTQxMTYsImV4cCI6MjA5MTU3MDExNn0.m7twUg7SfM6E7do-BSryayVgd26WW8GQkU-hdRyite4'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
