export type UserRole = 'customer' | 'staff' | 'admin'

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  is_active: boolean
  stars: number
  created_at: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  image_url: string | null
  customizable: boolean
  created_at: string
}

export interface CustomizationOption {
  id: string
  name: string
  type: 'size' | 'milk' | 'shots' | 'sweetness' | 'temperature' | 'extras'
  price_modifier: number
  is_available: boolean
  created_at: string
}

export interface MenuItemCustomization {
  id: string
  menu_item_id: string
  customization_option_id: string
}

export interface CartItem {
  menu_item: MenuItem
  quantity: number
  customizations: CustomizationOption[]
  special_instructions: string
  item_total: number
}

export interface OrderItem {
  menu_item_id: string
  menu_item_name: string
  quantity: number
  customizations: { type: string; name: string; price_modifier: number }[]
  special_instructions: string
  item_total: number
}

export interface Order {
  id: string
  user_id: string
  customer_name: string | null
  items: OrderItem[]
  total: number
  status: OrderStatus
  stars_earned: number
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  menu_item_id: string
  created_at: string
  menu_item?: MenuItem
}
