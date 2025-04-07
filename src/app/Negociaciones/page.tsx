"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Menu from "../Components/navegar";

type Negociacion = {
    ID_Negociaciones: number;
    Cliente_ID: number;
    ClienteNombre?: string;
    Fecha_Inicio: string;
    Fecha_Cierre: string;
    Estatus: "Iniciado" | "Terminado" | "Cancelado" | "En Revisión";
};

export default function Negociaciones() {
    const [negociaciones, setNegociaciones] = useState<Negociacion[]>([]);
    const [clientes, setClientes] = useState<{Cliente_ID: number, Nombre: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<Negociacion | null>(null);

    const columnas: Negociacion["Estatus"][] = ["Iniciado", "En Revisión", "Terminado", "Cancelado"];

    useEffect(() => {
        fetchNegociaciones();
        fetchClientes();
    }, []);

    const fetchNegociaciones = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("serversafesales-production.up.railway.app/api/negociaciones");
            if (Array.isArray(response.data)) {
                setNegociaciones(response.data);
            } else {
                console.error("Formato de datos inesperado:", response.data);
                setError("Formato de datos inesperado");
            }
        } catch (error) {
            console.error("Error obteniendo negociaciones:", error);
            setError("Error al cargar negociaciones");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await axios.get("serversafesales-production.up.railway.app/api/clientes");
            setClientes(response.data);
        } catch (error) {
            console.error("Error obteniendo clientes:", error);
        }
    };

    const handleDragStart = (e: React.DragEvent, item: Negociacion) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, newStatus: Negociacion["Estatus"]) => {
        e.preventDefault();
        if (!draggedItem) return;

        if (draggedItem.Estatus === newStatus) {
            setDraggedItem(null);
            return;
        }

        const updatedNegociacion = {
            ...draggedItem,
            Estatus: newStatus,
            Fecha_Cierre: newStatus === "Terminado" || newStatus === "Cancelado" 
                ? new Date().toISOString() 
                : draggedItem.Fecha_Cierre
        };

        setIsLoading(true);
        try {
            await axios.put(
                `serversafesales-production.up.railway.app/api/negociaciones/${draggedItem.ID_Negociaciones}`,
                updatedNegociacion
            );
            
            setNegociaciones(prev => 
                prev.map(n => 
                    n.ID_Negociaciones === draggedItem.ID_Negociaciones 
                    ? updatedNegociacion 
                    : n
                )
            );
            setError(null);
        } catch (error) {
            console.error("Error actualizando negociación:", error);
            setError("Error al actualizar el estado");
        } finally {
            setIsLoading(false);
            setDraggedItem(null);
        }
    };

    const getClienteNombre = (id: number) => {
        const cliente = clientes.find(c => c.Cliente_ID === id);
        return cliente ? cliente.Nombre : "Cliente no encontrado";
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10 overflow-auto">
                <h1 className="text-4xl font-bold mb-8">Kanban de Negociaciones</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                        <button 
                            onClick={() => setError(null)}
                            className="float-right font-bold"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-4 border-t border-b border-gray-300">
                    {columnas.map((col) => (
                        <div 
                            key={col}
                            className="flex flex-col border-l border-r border-gray-300 min-h-[400px] px-2"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col)}
                        >
                            <h2 className="text-xl font-semibold text-center py-2 border-b border-gray-300 bg-gray-100">
                                {col}
                            </h2>
                            <div className="flex flex-col gap-2 mt-2">
                                {negociaciones
                                    .filter((n) => n.Estatus === col)
                                    .map((n) => (
                                        <div
                                            key={n.ID_Negociaciones}
                                            className="bg-white border border-gray-300 shadow-sm rounded-lg p-4 text-sm cursor-move hover:shadow-md transition-shadow"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, n)}
                                        >
                                            <p><strong>ID:</strong> {n.ID_Negociaciones}</p>
                                            <p><strong>Cliente:</strong> {getClienteNombre(n.Cliente_ID)}</p>
                                            <p><strong>Inicio:</strong> {formatDate(n.Fecha_Inicio)}</p>
                                            <p><strong>Cierre:</strong> {formatDate(n.Fecha_Cierre)}</p>
                                            <p className={`mt-2 text-center font-medium ${
                                                col === "Terminado" ? "text-green-600" :
                                                col === "Cancelado" ? "text-red-600" :
                                                "text-blue-600"
                                            }`}>
                                                {col.toUpperCase()}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
