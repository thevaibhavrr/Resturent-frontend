import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner";
import { makeApi } from "../../api/makeapi";

interface Location {
  _id: string;
  name: string;
  restaurantId: string;
  status?: string;
}

export function LocationManagement() {
  const user = getCurrentUser();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    if (!user?.restaurantId) return;
    try {
      const res = await makeApi(`/api/space?restaurantId=${user.restaurantId}`, 'GET');
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load locations");
    }
  };

  const handleAdd = () => {
    setEditingLocation(null);
    setLocationName("");
    setIsDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.restaurantId) return;

    if (!locationName.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    const formattedName = locationName.toLowerCase().replace(/\s+/g, "-");

    try {
      if (editingLocation?._id) {
        await makeApi(`/api/space/${editingLocation._id}`, 'PUT', {
          name: formattedName,
          restaurantId: user.restaurantId,
        });
        toast.success("Location updated successfully");
      } else {
        await makeApi(`/api/space`, 'POST', {
          name: formattedName,
          restaurantId: user.restaurantId,
        });
        toast.success("Location added successfully");
      }
      setIsDialogOpen(false);
      loadLocations();
    } catch (err) {
      toast.error("Failed to save location");
    }
  };

  const handleDelete = async (location: Location) => {
    if (!user?.restaurantId) return;

    // API will return error if location has tables
    if (confirm("Are you sure you want to delete this location?")) {
      try {
        await makeApi(`/api/space/${location._id}`, 'DELETE');
        toast.success("Location deleted successfully");
        loadLocations();
      } catch (err) {
        toast.error("Failed to delete location. It may be in use by tables.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Location Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant areas and locations
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl">{locations.length}</p>
              <p className="text-sm text-muted-foreground">Total Locations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location._id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {location.name.replace(/-/g, " ")}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {location.status || 'Active'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(location)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(location)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {locations.length === 0 && (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No locations yet</p>
          <Button onClick={handleAdd} className="mt-4" variant="outline">
            Add your first location
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update location name"
                : "Create a new location for your restaurant"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Garden, Rooftop, VIP Lounge"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Spaces will be converted to hyphens automatically
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingLocation ? "Update" : "Add"} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
