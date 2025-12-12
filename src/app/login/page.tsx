'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SocialLogin } from "@/components/ui/SocialLogin"

// --- DATOS DE PAISES Y PROVINCIAS ---
const LOCATIONS: Record<string, string[]> = {
  "Argentina": ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero", "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Tierra del Fuego"],
  "Uruguay": ["Montevideo", "Canelones", "Maldonado", "Salto", "Colonia", "Paysandú", "San José", "Rivera", "Tacuarembó", "Cerro Largo", "Soriano", "Artigas", "Rocha", "Florida", "Lavalleja", "Durazno", "Río Negro", "Treinta y Tres", "Flores"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Iquique", "Talca", "Arica", "Puerto Montt", "Chillán", "Los Ángeles", "Calama", "Copiapó", "Osorno", "Quillota", "Valdivia"],
  "México": ["CDMX", "Jalisco", "Nuevo León", "Puebla", "Guanajuato", "Veracruz", "Yucatán", "Quintana Roo", "Chiapas", "Oaxaca"],
  "Colombia": ["Bogotá", "Antioquia", "Valle del Cauca", "Cundinamarca", "Atlántico", "Santander", "Bolívar"],
  "Otro": ["Otra"]
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)

  // Campos Básicos
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Campos Nuevos (Solo para Registro)
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [businessType, setBusinessType] = useState('') // Ahora es texto libre
  const [whatsapp, setWhatsapp] = useState('')

  // Obtener provincias según el país seleccionado
  const availableProvinces = useMemo(() => {
    return country ? LOCATIONS[country] || [] : []
  }, [country])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        // 1. VALIDACIÓN
        if (!email || !password || !country || !province || !businessType || !whatsapp) {
          throw new Error("Todos los campos son obligatorios para registrarse.")
        }

        // 2. REGISTRO EN SUPABASE
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              country,
              province,
              business_type: businessType, // Se guarda lo que el usuario escribió
              whatsapp,
            },
          },
        })
        if (error) throw error
        alert('¡Cuenta creada! Revisa tu correo para confirmar.')
      } 
      
      // 3. INICIO DE SESIÓN
      if (mode === 'login') {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (loginError) throw loginError
          router.push('/dashboard')
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-[450px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-600 text-2xl font-bold text-center">
             Nexostock 📦
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' 
              ? 'Ingresa para gestionar tu stock.' 
              : 'Completa el formulario para registrar tu negocio.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* --- CAMPOS COMUNES (Email/Pass) --- */}
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* --- CAMPOS SOLO PARA REGISTRO --- */}
            {mode === 'signup' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                    {/* PAÍS */}
                    <div className="space-y-2">
                        <Label>País</Label>
                        <Select onValueChange={(val) => { setCountry(val); setProvince(''); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(LOCATIONS).map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* PROVINCIA */}
                    <div className="space-y-2">
                        <Label>Provincia</Label>
                        <Select onValueChange={setProvince} disabled={!country}>
                            <SelectTrigger>
                                <SelectValue placeholder={!country ? "-" : "Seleccionar"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProvinces.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     {/* TIPO DE NEGOCIO (AHORA ES INPUT LIBRE) */}
                    <div className="space-y-2">
                        <Label>Tipo de Negocio</Label>
                        <Input 
                            type="text" 
                            placeholder="Ej: Ferretería"
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                        />
                    </div>

                    {/* WHATSAPP */}
                    <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input 
                            type="tel" 
                            placeholder="+54 9 11..." 
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                        />
                    </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={loading}>
              {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar' : 'Registrar Negocio')}
            </Button>
          </form>

          {/* DIVISOR Y LOGIN SOCIAL */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">O continúa con</span>
            </div>
          </div>

          <SocialLogin />

          {/* Toggle Login/Registro */}
          <div className="mt-6 text-center text-sm">
            <p className="text-slate-500">
              {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button 
                type="button"
                onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
              </button>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}