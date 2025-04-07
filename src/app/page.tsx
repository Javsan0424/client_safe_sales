"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); 

    try {
      const response = await fetch("serversafesales-production.up.railway.app/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          router.push("/Page1");
        } else {
          alert(data.message || "Credenciales incorrectas");
        }
      } else {
        alert("Error al conectar con el servidor");
      }
    } catch (error) {
      console.error("Error en la solicitud: ", error);
      alert("Error en la solicitud");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white-200">
      <div className="flex flex-col items-center bg-white h-120 w-100 text-black shadow-lg shadow-black p-4">
        <h1 className="mb-4 text-3xl font-bold mt-8">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="space-y-10 mt-20">
          <div>
            <input
              type="text"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-60 text-black shadow-lg shadow-black p-2"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-60 text-black shadow-lg shadow-black p-2"
            />
          </div>

          <div>
            <button
              type="submit"
              className="bg-blue-500 h-10 w-60 text-white shadow-lg shadow-black"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}