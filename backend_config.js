// backend_config.js
const SUPABASE_URL = "https://utbwadolroeeojxdfsuq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0YndhZG9scm9lZW9qeGRmc3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDI1NDEsImV4cCI6MjA4NjIxODU0MX0.LneMgpQhMATF_h5MAPo9KPmzcaZtbTXlKq1byDF3HwU";

const SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal" // Don't return the inserted row to save bandwidth
};

if (typeof window !== 'undefined') {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_HEADERS = SUPABASE_HEADERS;
} else if (typeof self !== 'undefined') {
    self.SUPABASE_URL = SUPABASE_URL;
    self.SUPABASE_HEADERS = SUPABASE_HEADERS;
}
