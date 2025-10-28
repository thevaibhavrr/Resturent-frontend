import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Edit2, Trash2, Filter } from "lucide-react";

import { makeApi } from "../../api/makeapi";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner";

interface Table {
  _id?: string;
  tableName: string;
  locationId: string;
  status?: string;
  location?: { _id: string; name: string };
}

interface Location {
  _id: string;
  name: string;
}

export function ManageTables() {
  const user = getCurrentUser();
  const [tables, setTables] = useState<Table[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocation, setFilterLocation] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    tableName: "",
    locationId: "",
  });

  useEffect(() => {
    fetchTables();
    fetchLocations();
  }, []);

  const fetchTables = async () => {
    if (!user?.restaurantId) return;
    try {
      const res = await makeApi(`/api/table?restaurantId=${user.restaurantId}`, 'GET', undefined);
      const tablesData = Array.isArray(res.data) ? res.data : [];
      // Normalize populated locationId to always expose `locationId` as string id and `location` as populated object
      const normalized = tablesData.map((t: any) => {
        const newT: any = { ...t };
        if (t.locationId && typeof t.locationId === 'object') {
          newT.location = t.locationId;
          newT.locationId = t.locationId._id || t.locationId.id || t.locationId;
        }
        return newT;
      });
      setTables(normalized);
    } catch (err) {
      toast.error("Failed to load tables");
    }
  };

  const fetchLocations = async () => {
    if (!user?.restaurantId) return;
    try {
      const res = await makeApi(`/api/space?restaurantId=${user.restaurantId}`, 'GET', undefined);
      const locationsData = Array.isArray(res.data) ? res.data : [];
      setLocations(locationsData);
      
      // Set default space if none selected and spaces exist
      if (locationsData.length > 0 && !formData.locationId) {
        setFormData(prev => ({ ...prev, locationId: locationsData[0]._id }));
      }
    } catch (err) {
      toast.error("Failed to load spaces");
    }
  };

  const handleAdd = () => {
    setEditingTable(null);
    setFormData({ 
      tableName: "", 
      locationId: locations[0]?._id || "" 
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({ 
      tableName: table.tableName, 
      locationId: table.locationId 
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.restaurantId) return;
    if (!formData.tableName.trim() || !formData.locationId) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      if (editingTable && editingTable._id) {
        await makeApi(`/api/table/${editingTable._id}`, 'PUT', {
          tableName: formData.tableName,
          locationId: formData.locationId,
          restaurantId: user.restaurantId,
        });
        toast.success("Table updated successfully");
      } else {
        await makeApi(`/api/table`, 'POST', {
          tableName: formData.tableName,
          locationId: formData.locationId,
          restaurantId: user.restaurantId,
        });
        toast.success("Table added successfully");
      }
      setIsDialogOpen(false);
      fetchTables();
    } catch (err) {
      toast.error("Failed to save table");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    
    try {
      await makeApi(`/api/table/${id}`, 'DELETE', undefined);
      toast.success("Table deleted successfully");
      fetchTables();
    } catch (err) {
      toast.error("Failed to delete table");
    }
  };

  // Ensure tables is always an array and apply filter
  const filteredTables = Array.isArray(tables) 
    ? (filterLocation === "all" 
      ? tables 
      : tables.filter((t) => t.locationId === filterLocation))
    : [];

  const getLocationName = (table: Table): string => {
    if (table.location?.name) {
      return table.location.name.replace(/-/g, " ").toUpperCase();
    }
    
    // Fallback: find space from locations array
    const location = locations.find(loc => loc._id === table.locationId);
    return location ? location.name.replace(/-/g, " ").toUpperCase() : "Unknown Space";
  };

  return (
    <div className="p-6 space-y-6" style={{ marginTop: "40px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Manage Tables</h1>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Table
        </Button>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spaces</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name.replace(/-/g, " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredTables.length} tables</Badge>
        </div>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <Card key={table._id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{table.tableName}</h3>
                <Badge variant="outline" className="text-xs mt-1">
                  {getLocationName(table)}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(table)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => table._id && handleDelete(table._id)}
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
      {filteredTables.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No tables found</p>
          <Button onClick={handleAdd} className="mt-4" variant="outline">
            Add your first table
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? "Edit Table" : "Add Table"}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? "Update table information"
                : "Create a new table for your restaurant"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tableName">Table Name *</Label>
              <Input
                id="tableName"
                value={formData.tableName}
                onChange={(e) =>
                  setFormData({ ...formData, tableName: e.target.value })
                }
                placeholder="e.g., G-1, FH-1, PH-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Space *</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, locationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a space" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name.replace(/-/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTable ? "Update" : "Add"} Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}