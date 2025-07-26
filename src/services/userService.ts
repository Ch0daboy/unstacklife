import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  default_author_name: string;
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') {
      return await createUserProfile();
    }
    throw error;
  }

  return data;
};

export const createUserProfile = async (): Promise<UserProfile> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      default_author_name: ''
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: Partial<Pick<UserProfile, 'default_author_name'>>): Promise<UserProfile> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};