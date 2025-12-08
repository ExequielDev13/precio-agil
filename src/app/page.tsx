import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-slate-900 tracking-tight">
          Precio<span className="text-blue-600">Ágil</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-md mx-auto">
          La forma más rápida de gestionar tus listas de precios, actualizar costos y exportar a PDF.
        </p>
        
        <div className="pt-4">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 text-lg">
              Ingresar al Sistema →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}