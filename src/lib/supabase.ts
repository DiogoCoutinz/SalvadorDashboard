import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type VendaResumo = {
  Vendedor: string
  No_cliente: string
  Cliente: string
  Familia: string
  Tipo: string
  Acum_ac: number
  Acum_aa: number
  Per_acum: number
  Crescimento: number
}

export type VendaMensal = {
  Vendedor: string
  No_cliente: string
  Cliente: string
  Familia: string
  Tipo: string
  Mes: string
  Valor: number
}

export type Filters = {
  vendedores?: string[]
  clientes?: string[]
  familias?: string[]
  tipo?: string
  meses?: string[] // for custom period
}

