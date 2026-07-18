import { useState } from 'react';
import { Search, Plus, Layers, Edit, Trash2, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, ActivityLogService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../services/CurrencyService';
import { toast } from '../lib/toast-store';

import { menuItemSchema, categorySchema } from '../lib/validations';
import { EmptyState } from '../components/ui/EmptyState';
import { ChefHat } from 'lucide-react';


export const Menu = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal States ───
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // ─── Form States ───
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    icon: '🍔',
    isAvailable: true,
    preparationStation: 'Chef'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    sortOrder: '0'
  });

  // ─── Queries ───
  const { data: menuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ['menu', tenant?.id],
    queryFn: () => MenuService.getMenu(tenant?.id || '', false), // Fetch all, including unavailable
    enabled: !!tenant?.id,
  });
  // ─── Item Mutations ───
  const createItemMutation = useMutation({
    mutationFn: (item: any) => MenuService.createMenuItem(item),
    onSuccess: (data) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_MENU_ITEM',
        entity: 'MENU_ITEM',
        entityId: data?.id,
        details: `Created menu item: ${data?.name || itemForm.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', tenant?.id] });
      setIsItemModalOpen(false);
      resetItemForm();
      toast.success('Item added', 'Menu item added successfully!');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => MenuService.updateMenuItem(id, data),
    onSuccess: (_data, variables) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'UPDATE_MENU_ITEM',
        entity: 'MENU_ITEM',
        entityId: variables.id,
        details: `Updated menu item: ${variables.data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', tenant?.id] });
      setIsItemModalOpen(false);
      resetItemForm();
      toast.success('Item updated', 'Menu item updated successfully!');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => MenuService.deleteMenuItem(id),
    onSuccess: (_data, id) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'DELETE_MENU_ITEM',
        entity: 'MENU_ITEM',
        entityId: id,
        details: `Deleted menu item ID: ${id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', tenant?.id] });
      setIsItemModalOpen(false);
      resetItemForm();
      toast.success('Item deleted', 'Menu item deleted successfully!');
    },
  });

  // ─── Category Mutations ───
  const createCategoryMutation = useMutation({
    mutationFn: (cat: any) => MenuService.createCategory(cat),
    onSuccess: (data) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_CATEGORY',
        entity: 'CATEGORY',
        entityId: data?.id,
        details: `Created category: ${data?.name || categoryForm.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', tenant?.id] });
      setCategoryForm({ name: '', sortOrder: '0' });
      toast.success('Category added', 'Category added successfully!');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => MenuService.deleteCategory(id),
    onSuccess: (_data, id) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'DELETE_CATEGORY',
        entity: 'CATEGORY',
        entityId: id,
        details: `Deleted category ID: ${id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', tenant?.id] });
      toast.success('Category deleted', 'Category deleted successfully!');
    },
  });

  const categories = isMenuLoading 
    ? ['All'] 
    : ['All', ...(menuData?.categories?.map((c: any) => c.name) || [])];
  const items = isMenuLoading ? [] : (menuData?.items || []);
  
  // ─── Filter & Search Logic ───
  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeFilter === 'All' || item.category?.name === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ─── Form Helpers ───
  const resetItemForm = () => {
    setItemForm({
      name: '',
      categoryId: '',
      price: '',
      description: '',
      icon: '🍔',
      isAvailable: true,
      preparationStation: 'Chef'
    });
    setSelectedItem(null);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId || '',
      price: String(item.price),
      description: item.description || '',
      icon: item.icon || '🍔',
      isAvailable: item.isAvailable,
      preparationStation: item.preparationStation || 'Chef'
    });
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = menuItemSchema.safeParse({
      name: itemForm.name,
      price: itemForm.price,
      categoryId: itemForm.categoryId,
      description: itemForm.description,
      preparationStation: itemForm.preparationStation,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Validation error';
      toast.warning('Invalid Menu Item Form', errorMsg);
      return;
    }

    const payload = {
      tenantId: tenant?.id,
      categoryId: itemForm.categoryId || null,
      name: itemForm.name,
      description: itemForm.description,
      price: Number(itemForm.price),
      icon: itemForm.icon,
      isAvailable: itemForm.isAvailable,
      preparationStation: itemForm.preparationStation
    };

    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, data: payload });
    } else {
      createItemMutation.mutate(payload);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = categorySchema.safeParse({
      name: categoryForm.name,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Validation error';
      toast.warning('Invalid Category Form', errorMsg);
      return;
    }

    createCategoryMutation.mutate({
      tenantId: tenant?.id,
      name: categoryForm.name,
      sortOrder: Number(categoryForm.sortOrder)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Menu</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Manage menu items and categories</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Layers size={16} /> Categories
          </button>
          <button 
            onClick={() => { resetItemForm(); setIsItemModalOpen(true); }}
            className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#ea580c] transition-colors shadow-lg shadow-[#F97316]/20 cursor-pointer"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#E5E7EB] text-sm bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]" 
          placeholder="Search menu items..." 
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button 
            key={c} 
            onClick={() => setActiveFilter(c)} 
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0", 
              activeFilter === c ? "bg-[#0B1630] text-white" : "bg-white text-[#64748B] border border-slate-200 hover:bg-slate-50"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isMenuLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-pulse bg-white">
              <div className="h-48 bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-5 bg-slate-100 rounded w-40" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-6 bg-slate-100 rounded w-16 pt-2" />
              </div>
            </Card>
          ))
        ) : filteredItems.map((item: any) => (
          <Card 
            key={item.id} 
            onClick={() => handleOpenEdit(item)}
            className="overflow-hidden border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg transition-shadow cursor-pointer relative group bg-white"
          >
            <div className="h-48 bg-slate-50 relative flex items-center justify-center text-6xl">
              {item.icon || '🍔'}
              
              <div className="absolute top-3 right-3 flex gap-1">
                {item.isAvailable ? (
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                  </span>
                ) : (
                  <span className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-rose-100 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Unavailable
                  </span>
                )}
              </div>

              {/* Hover overlay edit hint */}
              <div className="absolute inset-0 bg-[#0B1630]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-bold transition-opacity">
                <Edit size={18} className="mr-2" /> Edit Item
              </div>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider mb-1">{item.category?.name || 'Uncategorized'}</p>
              <h3 className="font-bold text-lg text-[#0B1630] mb-1">{item.name}</h3>
              <p className="text-sm text-[#94A3B8] mb-3 line-clamp-2">{item.description || 'No description available'}</p>
              <p className="text-2xl font-bold text-[#0B1630]">
                {format(Number(item.price))}
              </p>
            </div>
          </Card>
        ))}

        {!isMenuLoading && filteredItems.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <EmptyState
              icon={ChefHat}
              title="No menu items found"
              description="Get started by adding items to your menu."
              actionLabel="Add Item"
              onAction={() => { resetItemForm(); setIsItemModalOpen(true); }}
            />
          </div>
        )}
      </div>

      {/* ─── ADD/EDIT ITEM MODAL ─── */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-8 border-none shadow-2xl relative bg-white flex flex-col gap-6">
            <button 
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-2xl font-black text-[#0B1630]">{selectedItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <p className="text-sm text-[#64748B] font-medium">Configure items offered on your terminal menu</p>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Item Name</label>
                  <input 
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                    placeholder="e.g. Classic Burger"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                    placeholder="e.g. 250.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Category</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="">Select Category</option>
                    {menuData?.categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Preparation Station</label>
                  <select
                    value={itemForm.preparationStation}
                    onChange={(e) => setItemForm({ ...itemForm, preparationStation: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="Chef">Chef</option>
                    <option value="Barista">Barista</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Icon Emoji</label>
                  <input 
                    type="text"
                    value={itemForm.icon}
                    onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                    placeholder="e.g. 🍔"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Description</label>
                <textarea 
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                  placeholder="Details about ingredients, size, prep notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox"
                  id="itemAvailable"
                  checked={itemForm.isAvailable}
                  onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                  className="rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] w-4 h-4"
                />
                <label htmlFor="itemAvailable" className="text-sm font-bold text-[#0B1630] cursor-pointer">Available inPOS terminals</label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                {selectedItem ? (
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this menu item?')) {
                        deleteItemMutation.mutate(selectedItem.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 font-bold text-sm transition-all cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div />}
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {selectedItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── MANAGE CATEGORIES MODAL ─── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-8 border-none shadow-2xl relative bg-white flex flex-col gap-6">
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-2xl font-black text-[#0B1630]">Manage Categories</h3>
              <p className="text-sm text-[#64748B] font-medium">Add, update, or remove menu categories</p>
            </div>

            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input 
                type="text"
                required
                placeholder="New Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
              />
              <input 
                type="number"
                placeholder="Sort"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                className="w-20 h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
              />
              <button 
                type="submit"
                disabled={createCategoryMutation.isPending}
                className="h-11 px-4 bg-[#0B1630] hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus size={16} /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {menuData?.categories?.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-[#0B1630]">{cat.name}</span>
                    <span className="text-[10px] font-bold text-[#94A3B8] ml-3 uppercase">Order: {cat.sortOrder}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete category "${cat.name}"? All items in this category will be uncategorized.`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {(!menuData?.categories || menuData.categories.length === 0) && (
                <p className="text-center py-6 text-xs text-[#94A3B8] font-bold">No categories defined yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0B1630] font-bold text-sm rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Menu;
