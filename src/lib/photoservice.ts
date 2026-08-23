// @/lib/photoservice.ts
import { supabase, syncAppSession } from '@/integrations/supabase/client'; // Added syncAppSession
import { v4 as uuidv4 } from "uuid";

export interface UserPhoto {
  user_email: string;
  photo_url: string;
  photo_order: number;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

export class PhotoService {
  /**
   * Fetches photos for a specific user.
   * Uses fast get_full_profile RPC (SECURITY DEFINER) first to prevent RLS connection drops,
   * then falls back to direct select.
   */
  static async getUserPhotos(userEmail: string): Promise<UserPhoto[]> {
    if (!userEmail) return [];
    try {
      // 1. Try get_full_profile RPC first (Single roundtrip, bypasses RLS connection pool issues)
      const { data: fullProfile, error: rpcError } = await (supabase as any).rpc('get_full_profile', {
        p_email: userEmail
      });

      if (!rpcError && fullProfile?.photos && Array.isArray(fullProfile.photos)) {
        const photosList: UserPhoto[] = fullProfile.photos.map((p: any, index: number) => {
          if (typeof p === 'string') {
            return {
              user_email: userEmail,
              photo_url: p,
              photo_order: index,
              is_primary: index === 0,
              is_verified: false,
              created_at: '',
            };
          }
          return {
            user_email: p.user_email || userEmail,
            photo_url: p.photo_url || p.url || '',
            photo_order: typeof p.photo_order === 'number' ? p.photo_order : index,
            is_primary: typeof p.is_primary === 'boolean' ? p.is_primary : index === 0,
            is_verified: !!p.is_verified,
            created_at: p.created_at || '',
          };
        }).filter((p: UserPhoto) => !!p.photo_url);

        if (photosList.length > 0) return photosList;
      }

      // 2. Direct query fallback
      await syncAppSession(userEmail).catch(() => {});
      const { data, error } = await supabase
        .from("user_photos")
        .select("user_email, photo_url, photo_order, is_primary, is_verified, created_at")
        .eq("user_email", userEmail)
        .order("photo_order");

      if (!error && data) return data as UserPhoto[];
      return [];
    } catch (error) {
      console.warn("[PhotoService] getUserPhotos error:", error);
      return [];
    }
  }

  private static compressImage(file: File, maxPx = 1080, quality = 0.82): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' })),
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file); // fall back to original on error
      img.src = url;
    });
  }

  static async uploadPhoto(file: File, userEmail: string): Promise<string> {
    try {
      await syncAppSession(userEmail);

      const compressed = await PhotoService.compressImage(file);
      const fileName = `${userEmail}/${uuidv4()}.webp`;

      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(fileName, compressed, {
          cacheControl: '31536000',
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (error) {
      throw error;
    }
  }

  static async deletePhoto(userEmail: string, photoOrder: number): Promise<void> {
    await syncAppSession(userEmail);
    
    // 1. Fetch the URL of the photo we are about to delete
    const { data: photoData } = await supabase
      .from('user_photos')
      .select('photo_url')
      .eq('user_email', userEmail)
      .eq('photo_order', photoOrder)
      .single();

    // 2. Delete the actual file from storage — must succeed before touching DB
    if (photoData?.photo_url) {
      const filePath = photoData.photo_url.split('/user-photos/')[1]?.split('?')[0];
      if (filePath) {
        const { error: storageErr } = await supabase.storage.from('user-photos').remove([filePath]);
        if (storageErr) throw new Error(`Storage delete failed: ${storageErr.message}`);
      }
    }

    // 3. Delete the database row (only reached if storage delete succeeded)
    const { error } = await supabase
      .from('user_photos')
      .delete()
      .eq('user_email', userEmail)
      .eq('photo_order', photoOrder);

    if (error) throw error;
  }
  static async setPrimaryPhoto(userEmail: string, photoOrder: number): Promise<void> {
    await syncAppSession(userEmail);
    
    // Reset all
    await supabase
      .from('user_photos')
      .update({ is_primary: false } as any)
      .eq('user_email', userEmail);

    // Set new primary
    const { error } = await supabase
      .from('user_photos')
      .update({ is_primary: true } as any)
      .eq('user_email', userEmail)
      .eq('photo_order', photoOrder);
    
    if (error) throw error;
  }
}