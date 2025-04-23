"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Menu from "../Components/navegar";

type ClienteOption = {
  Cliente_ID: number;
  Nombre: string;
};

type Negociacion = {
  ID_Negociaciones: number;
  Cliente_ID: number;
  ClienteNombre?: string;
  Fecha_Inicio: string;
  Fecha_Cierre: string | null;
  Estatus: "Iniciado" | "Terminado" | "Cancelado" | "En Revisión";
};

export default function Negociaciones() {
  const [negociaciones, setNegociaciones] = useState<Negociacion[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState({
    page: true,
    drag: false,
    form: false
  });
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Negociacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newNegociacion, setNewNegociacion] = useState<Omit<Negociacion, "ID_Negociaciones" | "ClienteNombre">>({
    Cliente_ID: 0,
    Fecha_Inicio: new Date().toISOString().split("T")[0],
    Fecha_Cierre: null,
    Estatus: "Iniciado"
  });

  const columnas: Negociacion["Estatus"][] = ["Iniciado", "En Revisión", "Terminado", "Cancelado"];

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [negResponse, cliResponse] = await Promise.all([
          axios.get("https://serversafesales-production.up.railway.app/api/negociaciones", {
            signal: controller.signal
          }),
          axios.get("https://serversafesales-production.up.railway.app/api/clientes", {
            signal: controller.signal
          })
        ]);

        setNegociaciones(Array.isArray(negResponse.data) ? negResponse.data : []);
        setClientes(Array.isArray(cliResponse.data) ? cliResponse.data : []);
        setLoading(prev => ({...prev, page: false}));
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error fetching data:", error);
          setError("Error al cargar datos");
          setLoading(prev => ({...prev, page: false}));
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

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
  
    // Don't update if status hasn't changed
    if (draggedItem.Estatus === newStatus) {
      setDraggedItem(null);
      return;
    }
  
    // Prepare the updated negotiation data
    const updateData = {
      Cliente_ID: draggedItem.Cliente_ID,
      Fecha_Inicio: draggedItem.Fecha_Inicio,
      Fecha_Cierre: ["Terminado", "Cancelado"].includes(newStatus) 
        ? new Date().toISOString() 
        : null,
      Estatus: newStatus
    };
  
    setLoading(prev => ({...prev, drag: true}));
    
    try {
      const response = await axios.put(
        `https://serversafesales-production.up.railway.app/api/negociaciones/${draggedItem.ID_Negociaciones}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        // Update local state only after successful API response
        setNegociaciones(prev => 
          prev.map(n => 
            n.ID_Negociaciones === draggedItem.ID_Negociaciones 
              ? { ...n, ...updateData }
              : n
          )
        );
      } else {
        throw new Error(response.data.message || "Error en la respuesta del servidor");
      }
    } catch (error) {
      let errorMessage = "Error al actualizar el estado";
      
      if (axios.isAxiosError(error)) {
        // Handle Axios-specific errors
        if (error.response) {
          errorMessage = error.response.data.message || 
                        `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = "No se recibió respuesta del servidor";
        } else {
          errorMessage = `Error de configuración: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      console.error("Error actualizando negociación:", error);
      setError(errorMessage);
      
      // Revert the UI to previous state
      setNegociaciones(prev => [...prev]);
    } finally {
      setLoading(prev => ({...prev, drag: false}));
      setDraggedItem(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewNegociacion(prev => ({
      ...prev,
      [name]: name === "Cliente_ID" ? Number(value) : value
    }));
  };

  const handleAddNegociacion = async () => {
    if (!newNegociacion.Cliente_ID) {
      setError("Seleccione un cliente");
      return;
    }

    setLoading(prev => ({...prev, form: true}));
    try {
      const response = await axios.post(
        "https://serversafesales-production.up.railway.app/api/negociaciones",
        newNegociacion
      );

      if (response.data?.success) {
        setNegociaciones(prev => [...prev, {
          ...newNegociacion,
          ID_Negociaciones: response.data.negociacionId,
          ClienteNombre: clientes.find(c => c.Cliente_ID === newNegociacion.Cliente_ID)?.Nombre || ""
        }]);
        setShowModal(false);
        setNewNegociacion({
          Cliente_ID: 0,
          Fecha_Inicio: new Date().toISOString().split("T")[0],
          Fecha_Cierre: null,
          Estatus: "Iniciado"
        });
        setError(null);
      } else {
        throw new Error(response.data?.message || "Error al crear");
      }
    } catch (error) {
      console.error("Create error:", error);
      setError(`Error: ${error instanceof Error ? error.message : "Ocurrió un error"}`);
    } finally {
      setLoading(prev => ({...prev, form: false}));
    }
  };

  const getClienteNombre = (id: number) => {
    return clientes.find(c => c.Cliente_ID === id)?.Nombre || "Cliente no encontrado";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
  };

  return (
    <div className="h-screen flex">
      <Menu />
      <main className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tablero de Negociaciones</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            disabled={loading.page}
          >
            {loading.page ? "Cargando..." : "Nueva Negociación"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex justify-between items-center">
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {loading.drag && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
              <p>Actualizando estado...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {columnas.map(col => (
            <div
              key={col}
              className="border rounded-lg bg-gray-50 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col)}
            >
              <h2 className={`text-center py-3 font-semibold text-lg border-b ${
                col === "Iniciado" ? "bg-blue-50 text-blue-700" :
                col === "En Revisión" ? "bg-yellow-50 text-yellow-700" :
                col === "Terminado" ? "bg-green-50 text-green-700" :
                "bg-red-50 text-red-700"
              }`}>
                {col}
              </h2>
              <div className="p-3 space-y-3">
                {negociaciones
                  .filter(n => n.Estatus === col)
                  .map(n => (
                    <div
                      key={n.ID_Negociaciones}
                      draggable
                      onDragStart={e => handleDragStart(e, n)}
                      className={`p-4 rounded-lg shadow-sm border cursor-move hover:shadow-md transition-all ${
                        col === "Iniciado" ? "border-blue-200 bg-white" :
                        col === "En Revisión" ? "border-yellow-200 bg-white" :
                        col === "Terminado" ? "border-green-200 bg-white" :
                        "border-red-200 bg-white"
                      }`}
                    >
                      <p className="font-medium text-gray-700">{n.ClienteNombre || getClienteNombre(n.Cliente_ID)}</p>
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <p>Inicio: {formatDate(n.Fecha_Inicio)}</p>
                        <p>Cierre: {formatDate(n.Fecha_Cierre)}</p>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          col === "Iniciado" ? "bg-blue-100 text-blue-800" :
                          col === "En Revisión" ? "bg-yellow-100 text-yellow-800" :
                          col === "Terminado" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {n.Estatus}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Negotiation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Nueva Negociación</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                    <select
                      name="Cliente_ID"
                      value={newNegociacion.Cliente_ID}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading.form}
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.Cliente_ID} value={cliente.Cliente_ID}>
                          {cliente.Nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      name="Fecha_Inicio"
                      value={newNegociacion.Fecha_Inicio}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading.form}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
                    <select
                      name="Estatus"
                      value={newNegociacion.Estatus}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading.form}
                    >
                      <option value="Iniciado">Iniciado</option>
                      <option value="En Revisión">En Revisión</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading.form}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddNegociacion}
                    disabled={loading.form}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading.form ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}