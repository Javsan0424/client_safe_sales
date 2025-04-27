"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Menu from "../Components/navegar";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList
} from 'recharts';

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
            setError("Client, Product and Total are required fields");
            return;
        }

        const payload: Partial<Venta> = {
            Cliente_ID: Number(currentVenta.Cliente_ID),
            Producto_ID: Number(currentVenta.Producto_ID),
            Comision: currentVenta.Comision ? Number(currentVenta.Comision) : 0,
            Fecha: currentVenta.Fecha || new Date().toISOString().split('T')[0],
            Metodo_pago: currentVenta.Metodo_pago || 'Efectivo',
            Estado_pago: currentVenta.Estado_pago || 'Pendiente',
            Total: Number(currentVenta.Total)
        };

        setIsLoading(true);
        setError(null);

        try {
            const url = `https://serversafesales-production.up.railway.app/api/ventas${
                isEditing && currentVenta.Ventas_ID ? `/${currentVenta.Ventas_ID}` : ''
            }`;

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const response = isEditing && currentVenta.Ventas_ID
                ? await axios.put(url, payload, config)
                : await axios.post(url, payload, config);

            setShowModal(false);
            fetchVentas();
        } catch (error) {
            let errorMessage = "Error processing sale";

            if (axios.isAxiosError(error)) {
                console.error("Full error response:", error.response);

                if (error.response) {
                    errorMessage = error.response.data?.message || 
                                  error.response.data?.errorDetails?.sqlMessage || 
                                  error.response.data?.detail || 
                                  error.message;
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

    const chartData = clientes.map(cliente => {
        const ventasCliente = ventas.filter(v => v.Cliente_ID === cliente.Cliente_ID);
        const cantidadVentas = ventasCliente.length;
        const totalGenerado = ventasCliente.reduce((sum, venta) => sum + venta.Total, 0);
    
        return {
            nombre: cliente.Nombre,
            ventas: cantidadVentas,
            totalGenerado: totalGenerado
        };
    }).filter(data => data.ventas > 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-300 rounded shadow-md">
                    <p className="font-bold">{label}</p>
                    <p>Ventas realizadas: {data.ventas}</p>
                    <p>Total generado: ${data.totalGenerado.toFixed(2)}</p>
                </div>
            );
        }
        return null;
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

                {chartData.length > 0 && (
                    <div className="mb-10 bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-3xl mb-5">Ventas por Cliente</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />}/>
                                <Bar dataKey="ventas" fill="#3182CE">
                                    <LabelList dataKey="nombre" position="top" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

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
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                        <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Venta' : 'Registrar Venta'}</h2>
                            <div className="space-y-4">
                                <select
                                    name="Cliente_ID"
                                    value={currentVenta.Cliente_ID || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Seleccionar Cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.Cliente_ID} value={cliente.Cliente_ID}>
                                            {cliente.Nombre}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="Producto_ID"
                                    value={currentVenta.Producto_ID || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Seleccionar Producto</option>
                                    {productos.map(producto => (
                                        <option key={producto.Producto_ID} value={producto.Producto_ID}>
                                            {producto.Nombre}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    name="Comision"
                                    placeholder="Comisión"
                                    value={currentVenta.Comision || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />

                                <input
                                    type="date"
                                    name="Fecha"
                                    value={currentVenta.Fecha || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />

                                <select
                                    name="Metodo_pago"
                                    value={currentVenta.Metodo_pago || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>

                                <select
                                    name="Estado_pago"
                                    value={currentVenta.Estado_pago || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Pagado">Pagado</option>
                                </select>

                                <input
                                    type="number"
                                    name="Total"
                                    placeholder="Total"
                                    value={currentVenta.Total || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    {isEditing ? 'Actualizar' : 'Registrar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
