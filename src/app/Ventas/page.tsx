"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Menu from "../Components/navegar";

export default function Ventas() {
    type Venta = {
        Ventas_ID: number;
        Cliente_ID: number;
        Producto_ID: number;
        Comision: number;
        Fecha: string;
        Metodo_pago: 'Efectivo' | 'Tarjeta';
        Estado_pago: 'Pendiente' | 'Pagado';
        Total: number;
    }

    type Cliente = {
        Cliente_ID: number;
        Nombre: string;
    }

    type Producto = {
        Producto_ID: number;
        Nombre: string;
        Precio: number;
    }

    const [ventas, setVentas] = useState<Venta[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentVenta, setCurrentVenta] = useState<Partial<Venta>>({
        Fecha: new Date().toISOString().split('T')[0],
        Metodo_pago: 'Efectivo',
        Estado_pago: 'Pendiente'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchVentas();
        fetchClientes();
        fetchProductos();
    }, []);

    const fetchVentas = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/ventas');
            
            if (Array.isArray(response.data)) {
                setVentas(response.data);
            } else {
                console.error("Formato de datos inesperado:", response.data);
                setError("Formato de datos inesperado del servidor");
            }
        } catch (error) {
            console.error("Error obteniendo ventas:", error);
            setError("Error al cargar las ventas");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error("Error obteniendo clientes:", error);
        }
    };

    const fetchProductos = async () => {
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/productos');
            setProductos(response.data);
        } catch (error) {
            console.error("Error obteniendo productos:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentVenta({
            ...currentVenta,
            [name]: name === 'Cliente_ID' || name === 'Producto_ID' || name === 'Total' || name === 'Comision' 
                   ? Number(value) 
                   : value
        });
    };

    const handleSubmit = async () => {
        if (!currentVenta.Cliente_ID || !currentVenta.Producto_ID || !currentVenta.Total) {
            setError("Cliente, Producto y Total son campos obligatorios");
            return;
        }
    
       
        const payload = {
            ...currentVenta,
            Comision: currentVenta.Comision ? Number(currentVenta.Comision) : 0,
            Total: Number(currentVenta.Total)
        };
    
        setIsLoading(true);
        try {
            if (isEditing && currentVenta.Ventas_ID) {
                console.log("Updating venta with payload:", payload);
                const response = await axios.put(
                    `https://serversafesales-production.up.railway.app/api/ventas/${currentVenta.Ventas_ID}`,
                    payload
                );
                console.log("Update response:", response.data); 
            } else {
                await axios.post('https://serversafesales-production.up.railway.app/api/ventas', payload);
            }
            setShowModal(false);
            setError(null);
            fetchVentas();
        } catch (error) {
            console.error("Error guardando venta:", error);
            
            let errorMessage = "Error al guardar la venta";
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.sqlError) {
                    errorMessage += `: ${error.response.data.sqlError}`;
                }
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
            return;
        }

        setIsLoading(true);
        try {
            await axios.delete(`https://serversafesales-production.up.railway.app/api/ventas/${id}`);
            setVentas(ventas.filter(venta => venta.Ventas_ID !== id));
            setError(null);
        } catch (error) {
            console.error("Error eliminando venta:", error);
            setError("Error al eliminar la venta");
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (venta: Venta) => {
        setCurrentVenta(venta);
        setIsEditing(true);
        setShowModal(true);
    };

    const openAddModal = () => {
        setCurrentVenta({
            Cliente_ID: 0,
            Producto_ID: 0,
            Comision: 0,
            Fecha: new Date().toISOString().split('T')[0],
            Metodo_pago: 'Efectivo',
            Estado_pago: 'Pendiente',
            Total: 0
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const getClienteNombre = (id: number) => {
        const cliente = clientes.find(c => c.Cliente_ID === id);
        return cliente ? cliente.Nombre : 'Cliente no encontrado';
    };

    const getProductoNombre = (id: number) => {
        const producto = productos.find(p => p.Producto_ID === id);
        return producto ? producto.Nombre : 'Producto no encontrado';
    };

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-5xl">Lista de Ventas</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Registrar Venta
                    </button>
                </div>

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

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 border-b text-left">ID</th>
                                    <th className="py-2 px-4 border-b text-left">Cliente</th>
                                    <th className="py-2 px-4 border-b text-left">Producto</th>
                                    <th className="py-2 px-4 border-b text-left">Comisión</th>
                                    <th className="py-2 px-4 border-b text-left">Fecha</th>
                                    <th className="py-2 px-4 border-b text-left">Método Pago</th>
                                    <th className="py-2 px-4 border-b text-left">Estado</th>
                                    <th className="py-2 px-4 border-b text-left">Total</th>
                                    <th className="py-2 px-4 border-b text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventas.map((venta) => (
                                    <tr key={venta.Ventas_ID} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{venta.Ventas_ID}</td>
                                        <td className="py-2 px-4 border-b">{getClienteNombre(venta.Cliente_ID)}</td>
                                        <td className="py-2 px-4 border-b">{getProductoNombre(venta.Producto_ID)}</td>
                                        <td className="py-2 px-4 border-b">${venta.Comision.toFixed(2)}</td>
                                        <td className="py-2 px-4 border-b">{new Date(venta.Fecha).toLocaleDateString()}</td>
                                        <td className="py-2 px-4 border-b">{venta.Metodo_pago}</td>
                                        <td className={`py-2 px-4 border-b ${
                                            venta.Estado_pago === 'Pagado' ? 'text-green-600' : 'text-yellow-600'
                                        }`}>
                                            {venta.Estado_pago}
                                        </td>
                                        <td className="py-2 px-4 border-b">${venta.Total.toFixed(2)}</td>
                                        <td className="py-2 px-4 border-b space-x-2">
                                            <button
                                                onClick={() => openEditModal(venta)}
                                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(venta.Ventas_ID)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">
                                {isEditing ? 'Editar Venta' : 'Registrar Nueva Venta'}
                            </h2>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Cliente*</label>
                                <select
                                    name="Cliente_ID"
                                    value={currentVenta.Cliente_ID || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="0">Seleccione un cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.Cliente_ID} value={cliente.Cliente_ID}>
                                            {cliente.Nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Producto*</label>
                                <select
                                    name="Producto_ID"
                                    value={currentVenta.Producto_ID || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="0">Seleccione un producto</option>
                                    {productos.map(producto => (
                                        <option key={producto.Producto_ID} value={producto.Producto_ID}>
                                            {producto.Nombre} (${producto.Precio.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Fecha*</label>
                                <input
                                    type="date"
                                    name="Fecha"
                                    value={currentVenta.Fecha || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Método de Pago*</label>
                                <select
                                    name="Metodo_pago"
                                    value={currentVenta.Metodo_pago || 'Efectivo'}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Estado*</label>
                                <select
                                    name="Estado_pago"
                                    value={currentVenta.Estado_pago || 'Pendiente'}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Pagado">Pagado</option>
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Total*</label>
                                <input
                                    type="number"
                                    name="Total"
                                    value={currentVenta.Total || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Comisión</label>
                                <input
                                    type="number"
                                    name="Comision"
                                    value={currentVenta.Comision || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}