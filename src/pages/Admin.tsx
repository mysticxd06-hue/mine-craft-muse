import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  Moon, 
  ArrowLeft, 
  Users, 
  Shield, 
  Coins, 
  Search,
  Plus,
  Minus,
  Crown,
  Loader2,
  User,
  Clock,
  Ban
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  credits: number;
  role: 'admin' | 'user';
  fingerprints: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading } = useAuthContext();
  const { addCredits } = useCredits();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [creditAmount, setCreditAmount] = useState('10');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch profiles with credits and roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch credits for each user
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('user_id, credits');

      // Fetch roles for each user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Fetch fingerprint counts
      const { data: fingerprintsData } = await supabase
        .from('device_fingerprints')
        .select('user_id');

      const fingerprintCounts: Record<string, number> = {};
      fingerprintsData?.forEach(fp => {
        fingerprintCounts[fp.user_id] = (fingerprintCounts[fp.user_id] || 0) + 1;
      });

      const usersWithData: UserData[] = profiles?.map(p => ({
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        created_at: p.created_at,
        credits: creditsData?.find(c => c.user_id === p.id)?.credits ?? 0,
        role: (rolesData?.find(r => r.user_id === p.id)?.role as 'admin' | 'user') ?? 'user',
        fingerprints: fingerprintCounts[p.id] ?? 0,
      })) ?? [];

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddCredits = async (amount: number) => {
    if (!selectedUser || !user) return;
    
    setIsUpdating(true);
    try {
      const { success, error } = await addCredits(
        selectedUser.id,
        amount,
        user.id,
        `Admin credit ${amount > 0 ? 'grant' : 'deduction'}`
      );

      if (success) {
        toast({
          title: 'Credits updated',
          description: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} credits`,
        });
        fetchUsers();
        setSelectedUser(null);
      } else {
        throw new Error(error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update credits',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: 'admin' | 'user') => {
    setIsUpdating(true);
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      // Use secure RPC function instead of direct database update
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        _target_user_id: userId,
        _new_role: newRole,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; newRole?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update role');
      }

      toast({
        title: 'Role updated',
        description: `User is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-display text-lg">Admin Panel</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Lunar Sky Studios</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-3xl font-display text-foreground">{users.length}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Crown className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="text-3xl font-display text-foreground">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Coins className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Credits</span>
            </div>
            <p className="text-3xl font-display text-foreground">
              {users.reduce((sum, u) => sum + u.credits, 0)}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Devices</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {userData.display_name || 'No name'}
                          </p>
                          <p className="text-xs text-muted-foreground">{userData.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        userData.role === 'admin' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {userData.role === 'admin' && <Crown className="h-3 w-3" />}
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-foreground">
                        <Coins className="h-3.5 w-3.5 text-yellow-500" />
                        {userData.credits}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {userData.fingerprints}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(userData.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(userData)}
                        >
                          <Coins className="h-4 w-4 mr-1" />
                          Credits
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAdmin(userData.id, userData.role)}
                          disabled={userData.id === user?.id}
                        >
                          {userData.role === 'admin' ? (
                            <Ban className="h-4 w-4 text-destructive" />
                          ) : (
                            <Crown className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Credit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
            <DialogDescription>
              Update credits for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <span className="text-lg text-muted-foreground">Current:</span>
              <span className="text-3xl font-display text-primary">
                {selectedUser?.credits}
              </span>
              <Coins className="h-6 w-6 text-yellow-500" />
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Amount"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleAddCredits(-parseInt(creditAmount) || 0)}
                disabled={isUpdating}
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent"
                onClick={() => handleAddCredits(parseInt(creditAmount) || 0)}
                disabled={isUpdating}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
