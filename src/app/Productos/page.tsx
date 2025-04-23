"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Menu from "../Components/navegar";

export default function Productos() {
    type Producto = {
        Producto_ID: number;
        Nombre: string;
        Precio: number;
        Descripcion: string;
        Stock: number;
        Categoria: string;
    };

    const [productos, setProductos] = useState<Producto[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentProducto, setCurrentProducto] = useState<Partial<Producto>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/productos');
            
            if (response.data && Array.isArray(response.data)) {
                setProductos(response.data);
            } else {
                console.error("Formato de datos inesperado:", response.data);
                setError("Formato de datos inesperado del servidor");
            }
        } catch (error) {
            console.error("Error obteniendo productos:", error);
            setError("Error al cargar los productos");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentProducto({
            ...currentProducto,
            [name]: name === 'Precio' || name === 'Stock' ? parseFloat(value) || 0 : value
        });
    };

    const handleSubmit = async () => {
        if (!currentProducto.Nombre || !currentProducto.Categoria) {
            setError("Nombre y Categoría son campos obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing && currentProducto.Producto_ID) {
                const response = await axios.put(
                    `https://serversafesales-production.up.railway.app/api/productos/${currentProducto.Producto_ID}`,
                    currentProducto
                );
                
                if (response.data.success) {
                    setShowModal(false);
                    setError(null);
                    fetchProductos();
                } else {
                    setError(response.data.message || "Error al actualizar el producto");
                }
            } else {
                const response = await axios.post(
                    'https://serversafesales-production.up.railway.app/api/productos',
                    currentProducto
                );
                
                if (response.data.success) {
                    setShowModal(false);
                    setError(null);
                    fetchProductos();
                } else {
                    setError(response.data.message || "Error al agregar el producto");
                }
            }
        } catch (error: any) {
            console.error("Error guardando producto:", error);
            setError(error.response?.data?.message || "Error al guardar el producto");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.delete(
                `https://serversafesales-production.up.railway.app/api/productos/${id}`
            );
            
            if (response.data.success) {
                setProductos(productos.filter(producto => producto.Producto_ID !== id));
                setError(null);
            } else {
                setError(response.data.message || "Error al eliminar el producto");
            }
        } catch (error: any) {
            console.error("Error eliminando producto:", error);
            setError(error.response?.data?.message || "Error al eliminar el producto");
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (producto: Producto) => {
        setCurrentProducto({ ...producto });
        setIsEditing(true);
        setShowModal(true);
    };

    const openAddModal = () => {
        setCurrentProducto({
            Nombre: '',
            Precio: 0,
            Descripcion: '',
            Stock: 0,
            Categoria: ''
        });
        setIsEditing(false);
        setShowModal(true);
    };

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-5xl">Lista de Productos</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Agregar Producto
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
                                    <th className="py-2 px-4 border-b text-left">Nombre</th>
                                    <th className="py-2 px-4 border-b text-left">Precio</th>
                                    <th className="py-2 px-4 border-b text-left">Descripción</th>
                                    <th className="py-2 px-4 border-b text-left">Stock</th>
                                    <th className="py-2 px-4 border-b text-left">Categoría</th>
                                    <th className="py-2 px-4 border-b text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((producto) => (
                                    <tr key={producto.Producto_ID} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{producto.Producto_ID}</td>
                                        <td className="py-2 px-4 border-b">{producto.Nombre}</td>
                                        <td className="py-2 px-4 border-b">${producto.Precio.toFixed(2)}</td>
                                        <td className="py-2 px-4 border-b">{producto.Descripcion}</td>
                                        <td className="py-2 px-4 border-b">{producto.Stock}</td>
                                        <td className="py-2 px-4 border-b">{producto.Categoria}</td>
                                        <td className="py-2 px-4 border-b space-x-2">
                                            <button
                                                onClick={() => openEditModal(producto)}
                                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(producto.Producto_ID)}
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
                                {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                            </h2>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Nombre*</label>
                                <input
                                    type="text"
                                    name="Nombre"
                                    value={currentProducto.Nombre || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Precio*</label>
                                <input
                                    type="number"
                                    name="Precio"
                                    value={currentProducto.Precio || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Descripción</label>
                                <textarea
                                    name="Descripcion"
                                    value={currentProducto.Descripcion || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    rows={3}
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Stock*</label>
                                <input
                                    type="number"
                                    name="Stock"
                                    value={currentProducto.Stock || 0}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    min="0"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Categoría*</label>
                                <input
                                    type="text"
                                    name="Categoria"
                                    value={currentProducto.Categoria || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
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