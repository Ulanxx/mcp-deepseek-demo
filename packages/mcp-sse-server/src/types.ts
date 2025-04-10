// 产品类型定义
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

// 库存类型定义
export interface Inventory {
  productId: number;
  quantity: number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
}

// 订单类型定义
export interface Order {
  customerName: string;
  orderDate: string | number | Date;
  id: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  items: { productId: number; quantity: number }[];
  totalAmount: number;
}

// 购买请求类型定义
export interface PurchaseRequest {
  productId: number;
  quantity: number;
}

// 购买响应类型定义
export interface PurchaseResponse {
  orderId: number;
  success: boolean;
  message: string;
}
