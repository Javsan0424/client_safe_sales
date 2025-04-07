"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Menu from "../Components/navegar";

type Summary = {
  title: string;
  count: number;
  recent: string; 
};

type Message = {
  role: "user" | "model";
  parts: string;
};

export default function Tablero() {
  const [empresasSummary, setEmpresasSummary] = useState<Summary | null>(null);
  const [clientesSummary, setClientesSummary] = useState<Summary | null>(null);
  const [ventasSummary, setVentasSummary] = useState<Summary | null>(null);
  const [productosSummary, setProductosSummary] = useState<Summary | null>(null);
  const [negociacionesSummary, setNegociacionesSummary] = useState<Summary | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // API Key para Gemini 1.0 Pro (modelo gratuito)
  const API_KEY = "AIzaSyB7No1LofBlyTlXwp-peScPfG6pITUOwOI";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseEmpresas = await axios.get("serversafesales-production.up.railway.app/api/empresas");
        const responseClientes = await axios.get("serversafesales-production.up.railway.app/api/clientes");
        const responseVentas = await axios.get("serversafesales-production.up.railway.app/api/ventas");
        const responseProductos = await axios.get("serversafesales-production.up.railway.app/api/productos");
        const responseNegociaciones = await axios.get("serversafesales-production.up.railway.app/api/negociaciones");

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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsChatLoading(true);
    const userMessage: Message = {
      role: "user",
      parts: userInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    try {
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: userInput }]
            }],
            generationConfig: {
              temperature: 0.9,
              topP: 1,
              topK: 40,
              maxOutputTokens: 2048
            }
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get response from Gemini");
      }

      const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                          "No response from model";
      
      const modelMessage: Message = {
        role: "model",
        parts: modelResponse,
      };

      setChatMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "model",
        parts: `Error: ${error instanceof Error ? error.message : "An error occurred"}`,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-screen flex">
      <Menu />
      <main className="flex-1 p-10 relative">
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

        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
          aria-label="Chat with Gemini"
        >
          {showChat ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>

        {showChat && (
          <div className="fixed bottom-20 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
            <div className="bg-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold">Asistente Gemini (1.0 Pro)</h3>
              <button 
                onClick={() => setShowChat(false)} 
                className="text-white hover:text-gray-200"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto max-h-60">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  <p>Pregúntame sobre:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Tus datos del tablero</li>
                    <li>Análisis de negocios</li>
                    <li>Estrategias de ventas</li>
                    <li>Gestión de clientes</li>
                  </ul>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded text-sm ${message.role === "user" ? "bg-blue-100 ml-6" : "bg-gray-100 mr-6"}`}
                  >
                    <p className="font-semibold">{message.role === "user" ? "Tú" : "Gemini"}:</p>
                    <p className="whitespace-pre-wrap">{message.parts}</p>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-center p-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200">
              <div className="flex">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={isChatLoading || !userInput.trim()}
                  aria-label="Send message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}