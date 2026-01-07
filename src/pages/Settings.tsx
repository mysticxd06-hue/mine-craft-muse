import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Moon, ArrowLeft, Loader2, Upload, User, Trash2, Save, Mail, Shield } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const isEmailVerified = user?.email_confirmed_at != null;

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('id', user.id);

      if (error) throw error;

      refreshProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL (add cache buster)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      refreshProfile();
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('delete_user_account');

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }

      await signOut();
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResendingVerification(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox and click the verification link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <nav className="relative z-10 p-6 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <span className="font-display text-lg">Settings</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Email Verification Status */}
          {!isEmailVerified && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Email not verified</p>
                  <p className="text-sm text-muted-foreground">Please verify your email to access all features.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="shrink-0"
              >
                {isResendingVerification ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Resend'
                )}
              </Button>
            </div>
          )}

          {isEmailVerified && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-foreground">Email verified</p>
                <p className="text-sm text-muted-foreground">Your account is fully verified and secure.</p>
              </div>
            </div>
          )}

          {/* Profile Picture */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload New
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, or WebP. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Display Name</h2>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="pl-10 bg-secondary"
                  maxLength={50}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdating} className="gap-2">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-foreground">{profile?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Credits</Label>
                <p className="text-foreground">{profile?.credits ?? 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Member Since</Label>
                <p className="text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. All your projects, credits, and data will be permanently deleted.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all of your data from our servers, including all projects and credits.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Delete Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
}
