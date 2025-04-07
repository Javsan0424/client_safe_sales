"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Menu from "../Components/navegar";

export default function Empresas() {
    type Empresa = {
        Empresas_ID: number;
        Nombre: string;
        Numero: string;
        Direccion: string;
    };

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmpresa, setNewEmpresa] = useState<Omit<Empresa, 'Empresas_ID'>>({ 
        Nombre: '', 
        Numero: '', 
        Direccion: '' 
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://serversafesales-production.up.railway.app/api/empresas');
            console.log("Datos recibidos:", response.data);

            if (Array.isArray(response.data)) {
                setEmpresas(response.data);
            } else if (Array.isArray(response.data.empresas)) {
                setEmpresas(response.data.empresas);
            } else {
                console.error("Formato de datos inesperado:", response.data);
                setError("Formato de datos inesperado del servidor");
            }
        } catch (error) {
            console.error("Error obteniendo empresas:", error);
            setError("Error al cargar las empresas");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmpresa = async () => {
        if (!newEmpresa.Nombre || !newEmpresa.Direccion) {
            setError("Nombre y Dirección son campos obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('https://serversafesales-production.up.railway.app/api/empresas', newEmpresa);
            setEmpresas([...empresas, response.data]);
            setNewEmpresa({ Nombre: '', Numero: '', Direccion: '' });
            setShowAddModal(false);
            setError(null);
        } catch (error) {
            console.error("Error agregando empresa:", error);
            setError("Error al agregar la empresa");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEmpresa = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta empresa?")) {
            return;
        }

        setIsLoading(true);
        try {
            await axios.delete(`https://serversafesales-production.up.railway.app/api/empresas/${id}`);
            setEmpresas(empresas.filter(empresa => empresa.Empresas_ID !== id));
            setError(null);
        } catch (error) {
            console.error("Error eliminando empresa:", error);
            setError("Error al eliminar la empresa");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewEmpresa({
            ...newEmpresa,
            [name]: value
        });
    };

    return (
        <div className="h-screen flex">
            <Menu />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-5xl">Lista de Empresas</h1>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Agregar Empresa
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
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
                                    <th className="py-2 px-4 border-b text-left">Número</th>
                                    <th className="py-2 px-4 border-b text-left">Dirección</th>
                                    <th className="py-2 px-4 border-b text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empresas.map((empresa) => (
                                    <tr key={empresa.Empresas_ID} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{empresa.Empresas_ID}</td>
                                        <td className="py-2 px-4 border-b">{empresa.Nombre}</td>
                                        <td className="py-2 px-4 border-b">{empresa.Numero}</td>
                                        <td className="py-2 px-4 border-b">{empresa.Direccion}</td>
                                        <td className="py-2 px-4 border-b">
                                            <button
                                                onClick={() => handleDeleteEmpresa(empresa.Empresas_ID)}
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

                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Agregar Nueva Empresa</h2>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Nombre*</label>
                                <input
                                    type="text"
                                    name="Nombre"
                                    value={newEmpresa.Nombre}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Número</label>
                                <input
                                    type="text"
                                    name="Numero"
                                    value={newEmpresa.Numero}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Dirección*</label>
                                <input
                                    type="text"
                                    name="Direccion"
                                    value={newEmpresa.Direccion}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddEmpresa}
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