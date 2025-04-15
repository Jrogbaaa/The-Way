import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const modelData = await request.json();
    
    console.log('Saving model data:', modelData);
    
    // Validate required fields
    if (!modelData.id || !modelData.name || !modelData.version || !modelData.model_url) {
      return NextResponse.json({ error: 'Missing required model data' }, { status: 400 });
    }
    
    // Structure the data for database insertion
    const dbModelData = {
      id: modelData.id,
      name: modelData.name,
      description: modelData.description || '',
      version: modelData.version,
      model_url: modelData.model_url,
      status: modelData.status || 'ready',
      created_at: modelData.created_at || new Date().toISOString(),
      keyword: modelData.keyword || modelData.name.toLowerCase().replace(/\s+/g, '-'),
      input_parameters: modelData.input_parameters || {},
      category: 'Custom',
      is_public: false,
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('trained_models')
      .upsert(dbModelData, { onConflict: 'id' })
      .select();
      
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Model saved to database:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Model data saved successfully',
      model: data[0] 
    });
    
  } catch (error) {
    console.error('Error saving model data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 