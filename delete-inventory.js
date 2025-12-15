const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xswcyhptvufejxqggzvi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzd2N5aHB0dnVmZWp4cWdnenZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNTE5NjQsImV4cCI6MjA0OTcyNzk2NH0.QMzCe3UQYOoKxZcWjO2O3tBo-rLVPLZZH5aKSKAuSiE'
);

async function deleteAll() {
  try {
    // Get all items first
    const { data: items, error: fetchError } = await supabase
      .from('inventori')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching:', fetchError);
      return;
    }
    
    console.log('Found', items?.length || 0, 'items');
    
    // Delete all
    const { data, error } = await supabase
      .from('inventori')
      .delete()
      .neq('id', '');
    
    if (error) {
      console.error('Error deleting:', error);
    } else {
      console.log('Successfully deleted all items');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

deleteAll();
