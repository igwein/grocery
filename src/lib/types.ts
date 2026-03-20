export interface CatalogItem {
  id: string
  name: string
  category_emoji: string
  created_at: string
}

export interface PurchaseRecord {
  id: string
  item_name: string
  category_emoji: string
  purchased_at: string
  source: string
  created_at: string
}

export interface ShoppingListItem {
  id: string
  item_name: string
  category_emoji: string
  quantity: string | null
  notes: string | null
  added_by: string
  is_checked: boolean
  created_at: string
  checked_at: string | null
}

export interface AISuggestion {
  item_name: string
  category_emoji: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ReceiptItem {
  receipt_name: string
  item_name: string
  category_emoji: string
  quantity: string | null
  price: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type UserRole = 'manager' | 'shopper'
