export interface RawMaterial {
  _id: string;
  name: string;
  code: string;
  description?: string;
  unit: 'kg' | 'liter' | 'piece' | 'meter';
  unitPrice: number;
  stockQuantity: number;
  minimumStock: number;
  supplier?: {
    name: string;
    contact: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  materials: {
    material: RawMaterial;
    quantity: number;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  _id: string;
  type: 'office' | 'factory';
  name: string;
  code: string;
  quantity: number;
  unit: string;
  location: string;
  category: string;
  minimumStock: number;
  lastRestocked: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
  description?: string;
  reference?: string;
  approvalDate?: Date;
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobWork {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  startDate?: Date;
  dueDate?: Date;
  completionDate?: Date;
  materials: {
    material: RawMaterial;
    quantity: number;
  }[];
  notes: {
    content: string;
    addedBy: string;
    addedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}