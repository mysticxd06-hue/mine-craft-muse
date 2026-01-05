import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Ban,
  ShieldX,
  ShieldCheck,
  Activity,
  RefreshCw,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  credits: number;
  role: 'admin' | 'user';
  fingerprints: number;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  admin_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
  user_email?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuthContext();
  const { addCredits } = useCredits();
  const [users, setUsers] = useState<UserData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [creditAmount, setCreditAmount] = useState('10');
  const [banReason, setBanReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogType, setDialogType] = useState<'credits' | 'ban' | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('user_id, credits');

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

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
        is_banned: (p as any).is_banned ?? false,
        banned_at: (p as any).banned_at ?? null,
        ban_reason: (p as any).ban_reason ?? null,
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

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
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
        fetchAuditLogs();
        setDialogType(null);
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

  const handleSetCredits = async (credits: number) => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('admin_set_credits', {
        _target_user_id: selectedUser.id,
        _credits: credits,
        _reason: 'Admin set credits',
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to set credits');
      }

      toast({
        title: 'Credits set',
        description: `Credits set to ${credits}`,
      });
      fetchUsers();
      fetchAuditLogs();
      setDialogType(null);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set credits',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanUser = async (ban: boolean) => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('admin_ban_user', {
        _target_user_id: selectedUser.id,
        _ban: ban,
        _reason: ban ? banReason || 'No reason provided' : null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update ban status');
      }

      toast({
        title: ban ? 'User banned' : 'User unbanned',
        description: ban 
          ? `${selectedUser.display_name || selectedUser.email} has been banned` 
          : `${selectedUser.display_name || selectedUser.email} has been unbanned`,
      });
      fetchUsers();
      fetchAuditLogs();
      setDialogType(null);
      setSelectedUser(null);
      setBanReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ban status',
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
      fetchAuditLogs();
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

  const bannedUsers = users.filter(u => u.is_banned);
  const activeUsers = users.filter(u => !u.is_banned);

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
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchAuditLogs(); }}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Lunar Sky Studios</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-3xl font-display text-foreground">{activeUsers.length}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldX className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-sm text-muted-foreground">Banned</span>
            </div>
            <p className="text-3xl font-display text-foreground">{bannedUsers.length}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Coins className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Credits</span>
            </div>
            <p className="text-3xl font-display text-foreground">
              {users.reduce((sum, u) => sum + u.credits, 0)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="banned" className="gap-2">
              <ShieldX className="h-4 w-4" />
              Banned ({bannedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((userData) => (
                      <tr key={userData.id} className={`hover:bg-secondary/30 transition-colors ${userData.is_banned ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              userData.is_banned 
                                ? 'bg-destructive/20' 
                                : 'bg-gradient-to-br from-primary/20 to-accent/20'
                            }`}>
                              {userData.is_banned ? (
                                <ShieldX className="h-4 w-4 text-destructive" />
                              ) : (
                                <User className="h-4 w-4 text-primary" />
                              )}
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
                          {userData.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                              <Ban className="h-3 w-3" />
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                              <ShieldCheck className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm text-foreground">
                            <Coins className="h-3.5 w-3.5 text-yellow-500" />
                            {userData.credits}
                          </span>
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
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(userData.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(userData);
                                  setDialogType('credits');
                                  setCreditAmount(userData.credits.toString());
                                }}>
                                  <Coins className="h-4 w-4 mr-2" />
                                  Manage Credits
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => handleToggleAdmin(userData.id, userData.role)}
                                  disabled={userData.id === user?.id}
                                >
                                  {userData.role === 'admin' ? (
                                    <>
                                      <User className="h-4 w-4 mr-2" />
                                      Remove Admin
                                    </>
                                  ) : (
                                    <>
                                      <Crown className="h-4 w-4 mr-2" />
                                      Make Admin
                                    </>
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUser(userData);
                                    setDialogType('ban');
                                    setBanReason(userData.ban_reason || '');
                                  }}
                                  disabled={userData.id === user?.id}
                                  className={userData.is_banned ? 'text-green-500' : 'text-destructive'}
                                >
                                  {userData.is_banned ? (
                                    <>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Unban User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Ban User
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Banned Tab */}
          <TabsContent value="banned">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {bannedUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">No banned users</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bannedUsers.map((userData) => (
                    <div key={userData.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                          <ShieldX className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">{userData.display_name || userData.email}</p>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                          {userData.ban_reason && (
                            <p className="text-xs text-destructive/80 mt-1">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              {userData.ban_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Banned {userData.banned_at ? new Date(userData.banned_at).toLocaleDateString() : 'N/A'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userData);
                            setDialogType('ban');
                          }}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => {
                      const targetUser = users.find(u => u.id === log.user_id);
                      return (
                        <tr key={log.id} className="hover:bg-secondary/30">
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {targetUser?.display_name || targetUser?.email || log.user_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-sm font-medium ${
                              log.amount > 0 ? 'text-green-500' : log.amount < 0 ? 'text-destructive' : 'text-muted-foreground'
                            }`}>
                              {log.amount > 0 ? '+' : ''}{log.amount}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-muted-foreground max-w-xs truncate">
                            {log.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Credit Dialog */}
      <Dialog open={dialogType === 'credits'} onOpenChange={() => setDialogType(null)}>
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

            <div className="border-t border-border pt-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleSetCredits(parseInt(creditAmount) || 0)}
                disabled={isUpdating}
              >
                Set to {creditAmount} credits
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={dialogType === 'ban'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.is_banned ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Unban User
                </>
              ) : (
                <>
                  <Ban className="h-5 w-5 text-destructive" />
                  Ban User
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_banned 
                ? `Remove ban from ${selectedUser?.display_name || selectedUser?.email}` 
                : `Ban ${selectedUser?.display_name || selectedUser?.email} from using the platform`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedUser?.is_banned && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Ban Reason (optional)
                </label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                  className="bg-secondary border-border"
                />
              </div>
            )}

            {selectedUser?.is_banned && selectedUser.ban_reason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  <strong>Current ban reason:</strong> {selectedUser.ban_reason}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogType(null)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${selectedUser?.is_banned ? 'bg-green-500 hover:bg-green-600' : 'bg-destructive hover:bg-destructive/90'}`}
                onClick={() => handleBanUser(!selectedUser?.is_banned)}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
