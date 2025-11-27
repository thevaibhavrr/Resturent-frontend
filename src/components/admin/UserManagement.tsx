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
import { Plus, Edit2, Trash2, User, Check, X } from "lucide-react";
import { Loader } from "../ui/loader";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner@2.0.3";
import { getAllStaff, getStaffByRestaurant, createStaff, updateStaff, deleteStaff, checkUsername } from '../../api/staffApi';

interface StaffUser {
  _id: string;
  username: string;
  password: string;
  restaurantId?: string;
}

export function UserManagement() {
  const user = getCurrentUser();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean | null; message: string }>({ available: null, message: '' });

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    if (!user) {
      console.log("No user found, cannot load staff");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Use restaurant-specific API for better performance
      const staff = await getStaffByRestaurant(user.restaurantId);
      console.log("Staff for restaurant:", staff); // Debug log
      console.log("Current user:", user); // Debug log
      
      setStaffUsers(staff);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to fetch staff users");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ username: "", password: "" });
    setUsernameStatus({ available: null, message: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (staff: StaffUser) => {
    setEditingUser(staff);
    setFormData({ 
      username: staff.username,
      password: staff.password
    });
    setUsernameStatus({ available: true, message: '' });
    setIsDialogOpen(true);
  };

  const checkUsernameAvailability = async (username: string, excludeId?: string) => {
    if (!username) {
      setUsernameStatus({ available: null, message: '' });
      return false;
    }

    try {
      const { available } = await checkUsername(username, excludeId);
      setUsernameStatus({
        available,
        message: available ? 'Username is available' : 'Username is already taken'
      });
      return !available; // Return true if username is taken
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({
        available: false,
        message: 'Error checking username availability'
      });
      return true; // Assume username is taken to prevent submission on error
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.username || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    // First check if username is available
    const isTaken = await checkUsernameAvailability(formData.username, editingUser?._id);
    if (isTaken) {
      toast.error("Please choose a different username");
      return;
    }

    try {
      if (editingUser) {
        await updateStaff(editingUser._id, {
          username: formData.username,
          password: formData.password,
          restaurantId: user.restaurantId,
        });
        toast.success("User updated successfully");
      } else {
        await createStaff({
          username: formData.username,
          password: formData.password,
          restaurantId: user.restaurantId,
        });
        toast.success("User added successfully");
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

  if (loading) {
    return <Loader text="Loading staff users..." />;
  }

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
          <p className="text-xs">First staff: {staffUsers[0].username}</p>
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
                  {staff.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{staff.username}</p>
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
              <div>
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      setUsernameStatus({ available: null, message: '' });
                    }}
                    onBlur={(e) => checkUsernameAvailability(e.target.value, editingUser?._id)}
                    placeholder="Enter unique username for login"
                    className="pr-10"
                  />
                  {formData.username && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {usernameStatus.available === true && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {usernameStatus.available === false && (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {usernameStatus.message && (
                  <p className={`mt-1 text-sm ${usernameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameStatus.message}
                  </p>
                )}
              </div>
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
