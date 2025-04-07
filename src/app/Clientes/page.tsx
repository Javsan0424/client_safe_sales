"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Menu from "../Components/navegar";

export default function Clientes() {
    type Cliente = {
        Cliente_ID: number;
        Nombre: string;
        Email: string;
        Telefono: string;
        Empresa_ID: number;
    };

    type Empresa = {
        Empresas_ID: number;
        Nombre: string;
    };

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCliente, setNewCliente] = useState<Omit<Cliente, 'Cliente_ID'>>({ 
        Nombre: '', 
        Email: '',
        Telefono: '',
        Empresa_ID: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClientes();
        fetchEmpresas();
    }, []);

    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/clientes');
            
            if (Array.isArray(response.data)) {
                setClientes(response.data);
            } else if (response.data.clientes && Array.isArray(response.data.clientes)) {
                setClientes(response.data.clientes);
            } else {
                console.error("Formato de datos inesperado:", response.data);
                setError("Formato de datos inesperado del servidor");
            }
        } catch (error) {
            console.error("Error obteniendo clientes:", error);
            setError("Error al cargar los clientes");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmpresas = async () => {
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/empresas');
            setEmpresas(response.data);
        } catch (error) {
            console.error("Error obteniendo empresas:", error);
        }
    };

    const handleAddCliente = async () => {
        if (!newCliente.Nombre || !newCliente.Email || newCliente.Empresa_ID === 0) {
            setError("Nombre, Email y Empresa son campos obligatorios");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(newCliente.Email)) {
            setError("Por favor ingrese un email válido");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('https://serversafesales-production.up.railway.app/api/clientes', newCliente);
            setClientes([...clientes, response.data]);
            setNewCliente({ 
                Nombre: '', 
                Email: '',
                Telefono: '',
                Empresa_ID: 0
            });
            setShowAddModal(false);
            setError(null);
        } catch (error) {
            console.error("Error agregando cliente:", error);
            setError("Error al agregar el cliente");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCliente = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.delete(`https://serversafesales-production.up.railway.app/api/clientes/${id}`);
            
            if (response.status === 200) {
                setClientes(clientes.filter(cliente => cliente.Cliente_ID !== id));
                setError(null);
            } else {
                throw new Error(response.data.message || "Error al eliminar el cliente");
            }
        } catch (error: any) {
            console.error("Error eliminando cliente:", error);
            setError(error.response?.data?.message || "Error al eliminar el cliente");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCliente({
            ...newCliente,
            [name]: name === 'Empresa_ID' ? parseInt(value) : value
        });
    };

    const getEmpresaNombre = (empresaId: number) => {
        const empresa = empresas.find(e => e.Empresas_ID === empresaId);
        return empresa ? empresa.Nombre : 'Sin empresa';
    };

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-5xl">Lista de Clientes</h1>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Agregar Cliente
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
                                    <th className="py-2 px-4 border-b text-left">Email</th>
                                    <th className="py-2 px-4 border-b text-left">Teléfono</th>
                                    <th className="py-2 px-4 border-b text-left">Empresa</th>
                                    <th className="py-2 px-4 border-b text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map((cliente) => (
                                    <tr key={cliente.Cliente_ID} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{cliente.Cliente_ID}</td>
                                        <td className="py-2 px-4 border-b">{cliente.Nombre}</td>
                                        <td className="py-2 px-4 border-b">{cliente.Email}</td>
                                        <td className="py-2 px-4 border-b">{cliente.Telefono}</td>
                                        <td className="py-2 px-4 border-b">{getEmpresaNombre(cliente.Empresa_ID)}</td>
                                        <td className="py-2 px-4 border-b">
                                            <button
                                                onClick={() => handleDeleteCliente(cliente.Cliente_ID)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                                disabled={isLoading}
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

                
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Agregar Nuevo Cliente</h2>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Nombre*</label>
                                <input
                                    type="text"
                                    name="Nombre"
                                    value={newCliente.Nombre}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Email*</label>
                                <input
                                    type="email"
                                    name="Email"
                                    value={newCliente.Email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Teléfono</label>
                                <input
                                    type="text"
                                    name="Telefono"
                                    value={newCliente.Telefono}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Empresa*</label>
                                <select
                                    name="Empresa_ID"
                                    value={newCliente.Empresa_ID}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="0">Seleccione una empresa</option>
                                    {empresas.map(empresa => (
                                        <option key={empresa.Empresas_ID} value={empresa.Empresas_ID}>
                                            {empresa.Nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddCliente}
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