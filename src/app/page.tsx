import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-slate-900 tracking-tight">
          nexO<span className="text-blue-600">stock</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-lg mx-auto">
  Dile adiós a las planillas desordenadas. Centraliza tus productos, proveedores y precios en una plataforma simple, rápida y segura.
</p>
        
        <div className="pt-4">
          <Link href="/login">
            {/* Eliminamos 'type="submit"' y 'disabled={loading}' */}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg">
              Ingresar al Sistema →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}