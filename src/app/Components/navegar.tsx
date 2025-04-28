import Link from "next/link";

export default function Menu() {
    return (
        <div className="bg-gray-300 w-50 h-screen shadow-lg shadow-black">
            <div className="ml-8">
                <ol className="space-y-17">
                    <div className="flex justify-center mr-16">
                        <img src="/SafeSales Logo.jpg" alt="Processed Image" style={{ mixBlendMode: 'multiply', objectFit: 'contain'}} />
                    </div>
                    <div><Link href="/Page1" className="text-blue-500 hover:underline">Tablero</Link></div>
                    <div><Link href="/Empresas" className="text-blue-500 hover:underline">Empresas</Link></div>
                    <div><Link href="/Clientes" className="text-blue-500 hover:underline">Clientes</Link></div>
                    <div><Link href="/Productos" className="text-blue-500 hover:underline">Productos</Link></div>
                    <div><Link href="/Negociaciones" className="text-blue-500 hover:underline">Negociaciones</Link></div>
                    <div><Link href="/Ventas" className="text-blue-500 hover:underline">Ventas</Link></div>
                    <div><Link href="/Juego" className="text-blue-500 hover:underline">Juego Interactivo</Link></div>
                </ol>
            </div>
        </div>
    );
}
