import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Plus, Edit2, Trash2, User } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner@2.0.3";
import { getAllStaff, getStaffByRestaurant, createStaff, updateStaff, deleteStaff } from '../../api/staffApi';

interface StaffUser {
  _id: string;
  name: string;
  position: string;
  phone: string;
  username: string;
  password: string;
  restaurantId?: string;
}

export function UserManagement() {
  const user = getCurrentUser();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    phone: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    if (!user) {
      console.log("No user found, cannot load staff");
      return;
    }
    try {
      // Use restaurant-specific API for better performance
      const staff = await getStaffByRestaurant(user.restaurantId);
      console.log("Staff for restaurant:", staff); // Debug log
      console.log("Current user:", user); // Debug log
      
      setStaffUsers(staff);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to fetch staff users");
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: "", position: "", phone: "", username: "", password: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (staff: StaffUser) => {
    setEditingUser(staff);
    setFormData({ 
      name: staff.name, 
      position: staff.position, 
      phone: staff.phone,
      username: staff.username,
      password: staff.password
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.name || !formData.position || !formData.phone || !formData.username || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingUser) {
        await updateStaff(editingUser._id, {
          name: formData.name,
          position: formData.position,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          restaurantId: user.restaurantId,
        });
        toast.success("Staff updated successfully");
      } else {
        await createStaff({
          name: formData.name,
          position: formData.position,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          restaurantId: user.restaurantId,
        });
        toast.success("Staff added successfully");
      }
      loadStaffUsers();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save staff user");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff user?")) {
      try {
        await deleteStaff(id);
        loadStaffUsers();
        toast.success("Staff deleted successfully");
      } catch (error) {
        toast.error("Failed to delete staff user");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl mb-2">User Management</h1>
  
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Staff User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl">{staffUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Staff</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="p-4 bg-yellow-50">
        <h3 className="text-sm font-medium mb-2">Debug Info:</h3>
        <p className="text-xs">Staff count: {staffUsers.length}</p>
        <p className="text-xs">User: {user ? `${user.username} (${user.role})` : 'No user'}</p>
        <p className="text-xs">Restaurant ID: {user?.restaurantId || 'No restaurant ID'}</p>
        {staffUsers.length > 0 && (
          <p className="text-xs">First staff: {staffUsers[0].name} - {staffUsers[0].position} (Restaurant: {staffUsers[0].restaurantId})</p>
        )}
      </Card>

      {/* Staff List */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Staff Members</h2>
        <div className="space-y-3">
          {staffUsers.map((staff) => (
            <div
              key={staff._id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {staff.position}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{staff.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(staff)}
                  className="h-9 w-9"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(staff._id)}
                  className="h-9 w-9 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {staffUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No staff users yet</p>
            <Button onClick={handleAdd} className="mt-4" variant="outline">
              Add your first staff user
            </Button>
          </div>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update staff member information"
                : "Add a new staff member to your restaurant"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter staff name"
              />
            </div>
            <div>
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Chef">Chef</SelectItem>
                  <SelectItem value="Waiter">Waiter</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Host">Host</SelectItem>
                  <SelectItem value="Bartender">Bartender</SelectItem>
                  <SelectItem value="Kitchen Staff">Kitchen Staff</SelectItem>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username for login"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password for login"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? "Update" : "Add"} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
