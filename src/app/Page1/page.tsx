"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Menu from "../Components/navegar";

export default function Tablero() {
    type Summary = {
        title: string;
        count: number;
        recent: string; 
    };

    const [empresasSummary, setEmpresasSummary] = useState<Summary | null>(null);
    const [clientesSummary, setClientesSummary] = useState<Summary | null>(null);
    const [ventasSummary, setVentasSummary] = useState<Summary | null>(null);
    const [productosSummary, setProductosSummary] = useState<Summary | null>(null);
    const [negociacionesSummary, setNegociacionesSummary] = useState<Summary | null>(null);

    
    useEffect(() => {
        const fetchData = async () => {
            try {
                
                const responseEmpresas = await axios.get("http://localhost:3001/api/empresas");
                const responseClientes = await axios.get("http://localhost:3001/api/clientes");
                const responseVentas = await axios.get("http://localhost:3001/api/ventas");
                const responseProductos = await axios.get("http://localhost:3001/api/productos");
                const responseNegociaciones = await axios.get("http://localhost:3001/api/negociaciones");

                
                setEmpresasSummary({
                    title: "Empresas",
                    count: responseEmpresas.data.length,
                    recent: responseEmpresas.data[responseEmpresas.data.length - 1]?.Nombre || "No data"
                });
                setClientesSummary({
                    title: "Clientes",
                    count: responseClientes.data.length,
                    recent: responseClientes.data[responseClientes.data.length - 1]?.Nombre || "No data"
                });
                setVentasSummary({
                    title: "Ventas",
                    count: responseVentas.data.length,
                    recent: responseVentas.data[responseVentas.data.length - 1]?.Ventas_ID || "No data"
                });
                setProductosSummary({
                    title: "Productos",
                    count: responseProductos.data.length,
                    recent: responseProductos.data[responseProductos.data.length - 1]?.Nombre || "No data"
                });
                setNegociacionesSummary({
                    title: "Negociaciones",
                    count: responseNegociaciones.data.length,
                    recent: responseNegociaciones.data[responseNegociaciones.data.length - 1]?.Fecha_Inicio || "No data"
                });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10">
                <div className="text-5xl">Tablero</div>
                <br />
                <div className="grid grid-cols-3 gap-4">
                    {empresasSummary && (
                        <div className="bg-blue-100 p-5 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold">{empresasSummary.title}</h3>
                            <p>Count: {empresasSummary.count}</p>
                            <p>Most Recent: {empresasSummary.recent}</p>
                        </div>
                    )}
                    {clientesSummary && (
                        <div className="bg-green-100 p-5 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold">{clientesSummary.title}</h3>
                            <p>Count: {clientesSummary.count}</p>
                            <p>Most Recent: {clientesSummary.recent}</p>
                        </div>
                    )}
                    {ventasSummary && (
                        <div className="bg-yellow-100 p-5 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold">{ventasSummary.title}</h3>
                            <p>Count: {ventasSummary.count}</p>
                            <p>Most Recent: {ventasSummary.recent}</p>
                        </div>
                    )}
                    {productosSummary && (
                        <div className="bg-red-100 p-5 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold">{productosSummary.title}</h3>
                            <p>Count: {productosSummary.count}</p>
                            <p>Most Recent: {productosSummary.recent}</p>
                        </div>
                    )}
                    {negociacionesSummary && (
                        <div className="bg-purple-100 p-5 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold">{negociacionesSummary.title}</h3>
                            <p>Count: {negociacionesSummary.count}</p>
                            <p>Most Recent: {negociacionesSummary.recent}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
