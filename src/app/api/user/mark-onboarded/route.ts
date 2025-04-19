import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile onboarded status:', updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'User marked as onboarded.' });

  } catch (error) {
    console.error('Mark Onboarded Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 