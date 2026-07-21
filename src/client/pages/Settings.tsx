import { useState, useEffect } from 'react';
import { 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  CreditCard, 
  Printer,
  ShieldCheck,
  Users,
  UserCheck,
  Image as ImageIcon,
  Edit2,
  FileText,
  Save,
  X,
  DollarSign
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useTenant } from '../context/TenantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffService, SettingService, ActivityLogService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { toast } from '../lib/toast-store';
import { restaurantSettingsSchema } from '../lib/validations';
import { SubscriptionService } from '../services/SubscriptionService';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { CURRENCY_CONFIGS } from '../services/CurrencyService';

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  ETB: 'Ethiopian Birr',
  EUR: 'Euro',
  GBP: 'British Pound',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  KES: 'Kenyan Shilling',
  SOS: 'Somali Shilling'
};

export const Settings = () => {
  const { tenant, setTenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  // ─── Edit State Toggles ───
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isEditingReceipts, setIsEditingReceipts] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);

  // ─── Form States ───
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [hoursForm, setHoursForm] = useState({
    mon_fri: '08:00 AM - 10:00 PM',
    sat_sun: '09:00 AM - 11:00 PM'
  });

  const [receiptForm, setReceiptForm] = useState({
    receiptFooter: 'Thank you for dining with us!',
    logoEnabled: true,
    autoPrint: 'ON_PAID'
  });

  const [businessForm, setBusinessForm] = useState({
    currency: 'USD',
    timezone: 'UTC',
    taxRate: 15.00,
    tableAssignmentMode: 'OPEN'
  });

  // ─── Queries ───
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff', tenant?.id],
    queryFn: () => StaffService.getStaff(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // ─── Sync Form States with Query Data ───
  useEffect(() => {
    if (tenant) {
      setProfileForm({
        name: tenant.name || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        address: tenant.address || '',
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (settings) {
      setHoursForm({
        mon_fri: settings.businessHours?.mon_fri || '08:00 AM - 10:00 PM',
        sat_sun: settings.businessHours?.sat_sun || '09:00 AM - 11:00 PM'
      });
      setReceiptForm({
        receiptFooter: settings.receiptFooter || 'Thank you for dining with us!',
        logoEnabled: settings.logoUrl !== 'disabled',
        autoPrint: 'ON_PAID'
      });
      setBusinessForm({
        currency: settings.currency || 'USD',
        timezone: settings.timezone || 'UTC',
        taxRate: Number(settings.taxRate ?? 15.00),
        tableAssignmentMode: settings.tableAssignmentMode || 'OPEN'
      });
    }
  }, [settings]);

  // ─── Mutations ───
  const updateProfileMutation = useMutation({
    mutationFn: (updatedProfile: any) => SettingService.updateTenantProfile(tenant?.id || '', updatedProfile),
    onSuccess: (updatedTenant) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'UPDATE_PROFILE',
        entity: 'TENANT',
        entityId: tenant?.id,
        details: `Updated profile details: ${updatedTenant.name}`,
      });
      if (tenant) {
        setTenant({
          id: updatedTenant.id,
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          logo: updatedTenant.logo || undefined,
          phone: updatedTenant.phone || undefined,
          email: updatedTenant.email || undefined,
          address: updatedTenant.address || undefined,
          plan: tenant.plan,
          subscriptionStatus: tenant.subscriptionStatus,
          currency: tenant.currency,
          currencyCode: tenant.currencyCode,
          currencySymbol: tenant.currencySymbol,
          currencyName: tenant.currencyName
        });
      }
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Profile updated', 'Restaurant profile updated successfully!');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => SettingService.updateSettings(tenant?.id || '', updatedSettings),
    onSuccess: () => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'UPDATE_SETTINGS',
        entity: 'RESTAURANT_SETTINGS',
        details: 'Updated restaurant business settings',
      });
      setIsEditingHours(false);
      setIsEditingReceipts(false);
      setIsEditingBusiness(false);
      if (tenant) {
        const code = businessForm.currency;
        const symbol = CURRENCY_CONFIGS[code.toUpperCase()]?.symbol || code;
        const name = CURRENCY_NAMES[code] || code;
        setTenant({
          ...tenant,
          currency: code,
          currencyCode: code,
          currencySymbol: symbol,
          currencyName: name
        });
      }
      queryClient.invalidateQueries({ queryKey: ['settings', tenant?.id] });
      toast.success('Settings updated', 'Restaurant settings updated successfully!');
    },
  });

  // ─── Submit Handlers ───
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = restaurantSettingsSchema.pick({
      restaurantName: true,
      phone: true,
      email: true,
      address: true,
    }).safeParse({
      restaurantName: profileForm.name,
      phone: profileForm.phone,
      email: profileForm.email,
      address: profileForm.address,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Validation error';
      toast.warning('Invalid Profile Form', errorMsg);
      return;
    }

    updateProfileMutation.mutate({
      name: profileForm.name,
      phone: profileForm.phone,
      email: profileForm.email,
      address: profileForm.address,
    });
  };

  const handleHoursSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      ...settings,
      businessHours: {
        mon_fri: hoursForm.mon_fri,
        sat_sun: hoursForm.sat_sun
      }
    });
  };

  const handleReceiptSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      ...settings,
      receiptFooter: receiptForm.receiptFooter,
      logoUrl: receiptForm.logoEnabled ? 'enabled' : 'disabled'
    });
  };

  const handleBusinessSave = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = restaurantSettingsSchema.pick({
      currency: true,
      taxRate: true,
    }).safeParse({
      currency: businessForm.currency,
      taxRate: businessForm.taxRate,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Validation error';
      toast.warning('Invalid Business Form', errorMsg);
      return;
    }

    updateSettingsMutation.mutate({
      ...settings,
      currency: businessForm.currency,
      timezone: businessForm.timezone,
      taxRate: Number(businessForm.taxRate),
      tableAssignmentMode: businessForm.tableAssignmentMode
    });
  };

  const staffCounts = {
    total: staffMembers.length,
    admins: staffMembers.filter((s: any) => ['ADMIN', 'SUPER_ADMIN'].includes(s.role)).length,
    waiters: staffMembers.filter((s: any) => s.role === 'WAITER').length,
    cashiers: staffMembers.filter((s: any) => s.role === 'CASHIER').length,
    kitchen: staffMembers.filter((s: any) => s.role === 'KITCHEN_STAFF').length,
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1630]">Settings</h1>
        <p className="text-[#64748B] mt-1 text-sm font-medium">Manage your restaurant configuration</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Restaurant Information */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
           <div className="flex items-start justify-between mb-8">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Restaurant Information</h3>
              {!isEditingProfile ? (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0B1630] hover:bg-slate-50 transition-all"
                >
                  <Edit2 size={12} /> Edit Info
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleProfileSave}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                      if (tenant) {
                        setProfileForm({
                          name: tenant.name || '',
                          phone: tenant.phone || '',
                          email: tenant.email || '',
                          address: tenant.address || '',
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
           </div>

           <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              <div className="flex flex-col items-center gap-4 shrink-0">
                 <div 
                    onClick={() => {
                      if (!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'branding')) {
                        setUpgradeModalFeature('Branding & Custom Logos');
                      } else {
                        toast.info('Branding Settings', 'Branding configurations are set automatically or via platform manager.');
                      }
                    }}
                    className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer group hover:border-[#F97316] transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#F97316] transition-colors">
                       <Building size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-orange-500 mt-2 uppercase tracking-widest">Change Logo</span>
                 </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 w-full">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                       <Building size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Restaurant Name</p>
                       {isEditingProfile ? (
                         <input 
                           type="text" 
                           value={profileForm.name} 
                           onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                           className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                         />
                       ) : (
                         <p className="font-bold text-[#0B1630]">{tenant?.name || 'Dhadhan Bistro'}</p>
                       )}
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                       <Phone size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Phone Number</p>
                       {isEditingProfile ? (
                         <input 
                           type="text" 
                           value={profileForm.phone} 
                           onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                           className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                         />
                       ) : (
                         <p className="font-bold text-[#0B1630]">{tenant?.phone || 'Not Configured'}</p>
                       )}
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                       <MapPin size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Address</p>
                       {isEditingProfile ? (
                         <input 
                           type="text" 
                           value={profileForm.address} 
                           onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                           className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                         />
                       ) : (
                         <p className="font-bold text-[#0B1630]">{tenant?.address || 'Not Configured'}</p>
                       )}
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                       <Mail size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Business Email</p>
                       {isEditingProfile ? (
                         <input 
                           type="email" 
                           value={profileForm.email} 
                           onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                           className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                         />
                       ) : (
                         <p className="font-bold text-[#0B1630]">{tenant?.email || 'Not Configured'}</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        {/* Business Settings (Currency, Timezone, Tax) */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Business & Tax Settings</h3>
              {!isEditingBusiness ? (
                <button 
                  onClick={() => setIsEditingBusiness(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0B1630] hover:bg-slate-50 transition-all"
                >
                  <Edit2 size={12} /> Edit Settings
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleBusinessSave}
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingBusiness(false);
                      if (settings) {
                        setBusinessForm({
                          currency: settings.currency || 'USD',
                          timezone: settings.timezone || 'UTC',
                          taxRate: Number(settings.taxRate ?? 15.00),
                          tableAssignmentMode: settings.tableAssignmentMode || 'OPEN'
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <DollarSign size={18} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Currency Code</p>
                    {isEditingBusiness ? (
                      <select 
                        value={businessForm.currency}
                        onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="ETB">ETB (Br)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    ) : (
                      <p className="font-bold text-[#0B1630]">{settings?.currency || 'USD'}</p>
                    )}
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <Clock size={18} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">System Timezone</p>
                    {isEditingBusiness ? (
                      <select 
                        value={businessForm.timezone}
                        onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    ) : (
                      <p className="font-bold text-[#0B1630]">{settings?.timezone || 'UTC'}</p>
                    )}
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                    <ShieldCheck size={18} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">VAT/Tax Rate (%)</p>
                    {isEditingBusiness ? (
                      <input 
                        type="number" 
                        step="0.01"
                        value={businessForm.taxRate} 
                        onChange={(e) => setBusinessForm({ ...businessForm, taxRate: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                      />
                    ) : (
                      <p className="font-bold text-[#0B1630]">{settings?.taxRate ?? 15}%</p>
                    )}
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
                    <UserCheck size={18} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Table Assignment Mode</p>
                    {isEditingBusiness ? (
                      <select 
                        value={businessForm.tableAssignmentMode}
                        onChange={(e) => setBusinessForm({ ...businessForm, tableAssignmentMode: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]"
                      >
                        <option value="OPEN">Open Mode (Default)</option>
                        <option value="ASSIGNED">Assigned Mode</option>
                      </select>
                    ) : (
                      <p className="font-bold text-[#0B1630]">{settings?.tableAssignmentMode === 'ASSIGNED' ? 'Assigned Mode' : 'Open Mode'}</p>
                    )}
                 </div>
              </div>
           </div>
        </Card>

        {/* Business Hours */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Business Hours</h3>
              {!isEditingHours ? (
                <button 
                  onClick={() => setIsEditingHours(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0B1630] hover:bg-slate-50 transition-all"
                >
                  <Edit2 size={12} /> Edit Hours
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleHoursSave}
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingHours(false);
                      if (settings) {
                        setHoursForm({
                          mon_fri: settings.businessHours?.mon_fri || '08:00 AM - 10:00 PM',
                          sat_sun: settings.businessHours?.sat_sun || '09:00 AM - 11:00 PM'
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
           </div>

           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                 <Clock size={24} />
              </div>
              <div className="space-y-4 flex-1 w-full">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-24">
                    <div className="w-32">
                       <p className="text-sm font-bold text-[#0B1630]">Mon-Fri</p>
                    </div>
                    <div className="w-full sm:w-auto">
                       {isEditingHours ? (
                         <input 
                           type="text" 
                           value={hoursForm.mon_fri} 
                           onChange={(e) => setHoursForm({ ...hoursForm, mon_fri: e.target.value })}
                           className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630] w-full sm:w-64" 
                         />
                       ) : (
                         <p className="text-sm font-black text-[#0B1630]">{hoursForm.mon_fri}</p>
                       )}
                    </div>
                 </div>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-24">
                    <div className="w-32">
                       <p className="text-sm font-bold text-[#0B1630]">Sat-Sun</p>
                    </div>
                    <div className="w-full sm:w-auto">
                       {isEditingHours ? (
                         <input 
                           type="text" 
                           value={hoursForm.sat_sun} 
                           onChange={(e) => setHoursForm({ ...hoursForm, sat_sun: e.target.value })}
                           className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630] w-full sm:w-64" 
                         />
                       ) : (
                         <p className="text-sm font-black text-[#0B1630]">{hoursForm.sat_sun}</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        {/* Receipt Settings */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Receipt Settings</h3>
              {!isEditingReceipts ? (
                <button 
                  onClick={() => {
                    if (!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'receiptManagement')) {
                      setUpgradeModalFeature('Receipt Management');
                    } else {
                      setIsEditingReceipts(true);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0B1630] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Edit2 size={12} /> Edit Settings
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleReceiptSave}
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingReceipts(false);
                      if (settings) {
                        setReceiptForm({
                          receiptFooter: settings.receiptFooter || 'Thank you for dining with us!',
                          logoEnabled: settings.logoUrl !== 'disabled',
                          autoPrint: 'ON_PAID'
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                       <ImageIcon size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Receipt Logo</p>
                       {isEditingReceipts ? (
                         <div className="flex items-center gap-2 mt-1">
                           <input 
                             type="checkbox" 
                             checked={receiptForm.logoEnabled}
                             onChange={(e) => setReceiptForm({ ...receiptForm, logoEnabled: e.target.checked })}
                             className="rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] w-4 h-4"
                           />
                           <span className="text-sm font-bold text-[#0B1630]">Include Logo</span>
                         </div>
                       ) : (
                         <p className="text-sm font-bold text-emerald-500">{receiptForm.logoEnabled ? 'Enabled' : 'Disabled'}</p>
                       )}
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                       <FileText size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Footer Message</p>
                       {isEditingReceipts ? (
                         <textarea 
                           value={receiptForm.receiptFooter} 
                           onChange={(e) => setReceiptForm({ ...receiptForm, receiptFooter: e.target.value })}
                           className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630]" 
                           rows={2}
                         />
                       ) : (
                         <p className="text-sm font-medium text-[#64748B] italic">"{receiptForm.receiptFooter}"</p>
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                       <Printer size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Auto Print</p>
                       <p className="text-sm font-bold text-[#0B1630]">On Paid Order</p>
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        {/* Payments */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Payments Configuration</h3>
              <CreditCard size={20} className="text-slate-300" />
           </div>
           <div className="flex items-center gap-12 overflow-x-auto pb-4">
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                 <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <UserCheck size={12} className="text-white" />
                 </div>
                 <span className="text-xs font-bold text-[#0B1630]">Cash</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                 <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <UserCheck size={12} className="text-white" />
                 </div>
                 <span className="text-xs font-bold text-[#0B1630]">Card</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                 <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <UserCheck size={12} className="text-white" />
                 </div>
                 <span className="text-xs font-bold text-[#0B1630]">Mobile Money</span>
              </div>
           </div>
        </Card>

        {/* Staff & Permissions Summary */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Staff & Permissions</h3>
              <Users size={20} className="text-slate-300" />
           </div>
           <div className="grid grid-cols-5 gap-6">
              {[
                { label: 'Total Staff', count: staffCounts.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Admins', count: staffCounts.admins, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { label: 'Waiters', count: staffCounts.waiters, icon: UserCheck, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Cashiers', count: staffCounts.cashiers, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Kitchen', count: staffCounts.kitchen, icon: Building, color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-4 rounded-3xl bg-slate-50/50 border border-slate-50">
                   <h4 className="text-3xl font-black text-[#0B1630] mb-2">{item.count}</h4>
                   <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-4">{item.label}</p>
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                      <item.icon size={18} />
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>
      {upgradeModalFeature && (
        <UpgradeDialog 
          feature={upgradeModalFeature}
          requiredPlan="Professional"
          onClose={() => setUpgradeModalFeature(null)}
        />
      )}
    </div>
  );
};

export default Settings;
