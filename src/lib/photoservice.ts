import { supabase } from '@/integrations/supabase/client';
import {v4 as uuidv4}from "uuid";
export interface UserPhoto {
  user_email: string;
  photo_url: string;
  photo_order: number;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

export class PhotoService {
  // Upload photo to Supabase storage
  static async uploadPhoto(file: File, userEmail: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      
      const fileName = `${userEmail}/${uuidv4()}.${fileExt}`;
      
      
      const { data, error } = await supabase.storage
        .from('user-photos') // Changed from 'user_photos' to match your bucket name
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false
        });

      if (error) {
        throw error;
      }
      if (!data || !data.path) {
      throw new Error("Upload completed but no file path was returned.");
    }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (error) {
      throw error;
    }
  }

  // Add photo to user_photos table with RLS-compliant authentication check
  static async addUserPhoto(
    userEmail: string,
    photoUrl: string,
    photoOrder: number,
    isPrimary: boolean = false
  ): Promise<UserPhoto> {
    try {
      
      const insertData: any = {
        user_email: userEmail,
        photo_url: photoUrl,
        photo_order: photoOrder,
        is_primary: isPrimary,
        is_verified: false
      };

      const { data, error } = await supabase
        .from('user_photos')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as UserPhoto;
    } catch (error) {
      throw error;
    }
  }

  // Get user photos with RLS compliance
  static async getUserPhotos(userEmail: string) {
  const { data, error } = await supabase
    .from("user_photos")  // <-- NOT supabase.storage
    .select("user_email, photo_url, photo_order, is_primary, is_verified, created_at")
    .eq("user_email", userEmail)
    .order("photo_order");

  if (error) throw error;
  return data;
}

  // Delete photo with RLS compliance
  static async deletePhoto(userEmail: string, photoOrder: number): Promise<void> {
    try {
      
      const { error } = await supabase
        .from('user_photos')
        .delete()
        .eq('user_email', userEmail)
        .eq('photo_order', photoOrder);

      if (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }

  // Set primary photo with RLS compliance
  static async setPrimaryPhoto(userEmail: string, photoOrder: number): Promise<void> {
    try {
      
      // First, remove primary flag from all user's photos
      await supabase
        .from('user_photos')
        .update({ is_primary: false } as any)
        .eq('user_email', userEmail);

      // Then set the selected photo as primary
      const { error } = await supabase
        .from('user_photos')
        .update({ is_primary: true } as any)
        .eq('user_email', userEmail)
        .eq('photo_order', photoOrder);

      if (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }
}