"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Menu from "../Components/navegar";

type ClienteOption = {
  Cliente_ID: number;
  Nombre: string;
};

type Negociacion = {
  ID_Negociaciones?: number;
  Cliente_ID: number;
  ClienteNombre?: string;
  Fecha_Inicio: string;
  Fecha_Cierre?: string;
  Estatus: "Iniciado" | "Terminado" | "Cancelado" | "En Revisión";
};

export default function Negociaciones() {
  const [negociaciones, setNegociaciones] = useState<Negociacion[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Negociacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newNegociacion, setNewNegociacion] = useState<
    Omit<Negociacion, "ID_Negociaciones" | "ClienteNombre">
  >({
    Cliente_ID: 0,
    Fecha_Inicio: new Date().toISOString().split("T")[0],
    Estatus: "Iniciado",
  });

  const columnas: Negociacion["Estatus"][] = [
    "Iniciado",
    "En Revisión",
    "Terminado",
    "Cancelado",
  ];

  useEffect(() => {
    fetchNegociaciones();
    fetchClientes();
  }, []);

  const fetchNegociaciones = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "https://serversafesales-production.up.railway.app/api/negociaciones"
      );
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
      const response = await axios.get(
        "https://serversafesales-production.up.railway.app/api/clientes"
      );
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
      Fecha_Cierre:
        newStatus === "Terminado" || newStatus === "Cancelado"
          ? new Date().toISOString()
          : draggedItem.Fecha_Cierre,
    };

    setIsLoading(true);
    try {
      await axios.put(
        `https://serversafesales-production.up.railway.app/api/negociaciones/${draggedItem.ID_Negociaciones}`,
        updatedNegociacion
      );

      setNegociaciones((prev) =>
        prev.map((n) =>
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewNegociacion({
      ...newNegociacion,
      [name]: name === "Cliente_ID" ? parseInt(value) : value,
    });
  };

  const handleAddNegociacion = async () => {
    if (!newNegociacion.Cliente_ID) {
      setError("Debe seleccionar un cliente");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://serversafesales-production.up.railway.app/api/negociaciones",
        newNegociacion
      );

      if (response.data.success) {
        setShowModal(false);
        setError(null);
        setNewNegociacion({
          Cliente_ID: 0,
          Fecha_Inicio: new Date().toISOString().split("T")[0],
          Estatus: "Iniciado",
        });
        await fetchNegociaciones();
      } else {
        setError(response.data.message || "Error al agregar la negociación");
      }
    } catch (error: any) {
      console.error("Error adding negotiation:", error);
      setError(
        error.response?.data?.message || "Error al agregar la negociación"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getClienteNombre = (id: number) => {
    const cliente = clientes.find((c) => c.Cliente_ID === id);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Kanban de Negociaciones</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar Negociación
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
                      <p>
                        <strong>ID:</strong> {n.ID_Negociaciones}
                      </p>
                      <p>
                        <strong>Cliente:</strong>{" "}
                        {n.ClienteNombre || getClienteNombre(n.Cliente_ID)}
                      </p>
                      <p>
                        <strong>Inicio:</strong> {formatDate(n.Fecha_Inicio)}
                      </p>
                      <p>
                        <strong>Cierre:</strong> {formatDate(n.Fecha_Cierre || "")}
                      </p>
                      <p
                        className={`mt-2 text-center font-medium ${
                          col === "Terminado"
                            ? "text-green-600"
                            : col === "Cancelado"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {col.toUpperCase()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Negotiation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                Agregar Nueva Negociación
              </h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Cliente*</label>
                <select
                  name="Cliente_ID"
                  value={newNegociacion.Cliente_ID}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.Cliente_ID} value={cliente.Cliente_ID}>
                      {cliente.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="Fecha_Inicio"
                  value={newNegociacion.Fecha_Inicio}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Estado</label>
                <select
                  name="Estatus"
                  value={newNegociacion.Estatus}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="Iniciado">Iniciado</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddNegociacion}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {isLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}